from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Product:
    id: int
    name: str


@dataclass(frozen=True)
class Plan:
    id: int
    product_id: int
    name: str
    monthly_price: Decimal


@dataclass(frozen=True)
class Customer:
    id: int
    name: str
    email: str


@dataclass(frozen=True)
class Subscription:
    id: int
    customer_id: int
    plan_id: int
    status: str


@dataclass(frozen=True)
class Invoice:
    id: int
    subscription_id: int
    amount_due: Decimal
    issued_on: date
    status: str


@dataclass(frozen=True)
class Payment:
    id: int
    invoice_id: int
    amount: Decimal
    paid_on: date


class SubscriptionPlatform:
    def __init__(self) -> None:
        self.products: dict[int, Product] = {}
        self.plans: dict[int, Plan] = {}
        self.customers: dict[int, Customer] = {}
        self.subscriptions: dict[int, Subscription] = {}
        self.invoices: dict[int, Invoice] = {}
        self.payments: dict[int, Payment] = {}
        self._next_ids = {
            "product": 1,
            "plan": 1,
            "customer": 1,
            "subscription": 1,
            "invoice": 1,
            "payment": 1,
        }

    def _next_id(self, key: str) -> int:
        item_id = self._next_ids[key]
        self._next_ids[key] += 1
        return item_id

    def create_product(self, name: str) -> Product:
        product = Product(id=self._next_id("product"), name=name)
        self.products[product.id] = product
        return product

    def create_plan(self, product_id: int, name: str, monthly_price: Decimal | str | int) -> Plan:
        if product_id not in self.products:
            raise ValueError("Product does not exist")
        price = Decimal(monthly_price)
        if price <= 0:
            raise ValueError("Monthly price must be greater than zero")
        plan = Plan(id=self._next_id("plan"), product_id=product_id, name=name, monthly_price=price)
        self.plans[plan.id] = plan
        return plan

    def create_customer(self, name: str, email: str) -> Customer:
        customer = Customer(id=self._next_id("customer"), name=name, email=email)
        self.customers[customer.id] = customer
        return customer

    def start_subscription(self, customer_id: int, plan_id: int) -> Subscription:
        if customer_id not in self.customers:
            raise ValueError("Customer does not exist")
        if plan_id not in self.plans:
            raise ValueError("Plan does not exist")
        subscription = Subscription(
            id=self._next_id("subscription"),
            customer_id=customer_id,
            plan_id=plan_id,
            status="active",
        )
        self.subscriptions[subscription.id] = subscription
        return subscription

    def cancel_subscription(self, subscription_id: int) -> Subscription:
        subscription = self.subscriptions.get(subscription_id)
        if not subscription:
            raise ValueError("Subscription does not exist")
        updated = Subscription(
            id=subscription.id,
            customer_id=subscription.customer_id,
            plan_id=subscription.plan_id,
            status="cancelled",
        )
        self.subscriptions[subscription_id] = updated
        return updated

    def generate_invoice(self, subscription_id: int, issued_on: date | None = None) -> Invoice:
        subscription = self.subscriptions.get(subscription_id)
        if not subscription:
            raise ValueError("Subscription does not exist")
        if subscription.status != "active":
            raise ValueError("Cannot invoice a non-active subscription")
        plan = self.plans[subscription.plan_id]
        invoice = Invoice(
            id=self._next_id("invoice"),
            subscription_id=subscription_id,
            amount_due=plan.monthly_price,
            issued_on=issued_on or date.today(),
            status="unpaid",
        )
        self.invoices[invoice.id] = invoice
        return invoice

    def record_payment(
        self,
        invoice_id: int,
        amount: Decimal | str | int | None = None,
        paid_on: date | None = None,
    ) -> Payment:
        invoice = self.invoices.get(invoice_id)
        if not invoice:
            raise ValueError("Invoice does not exist")
        if invoice.status == "paid":
            raise ValueError("Invoice is already paid")

        payment_amount = Decimal(amount) if amount is not None else invoice.amount_due
        if payment_amount != invoice.amount_due:
            raise ValueError("Payment amount must match invoice amount")

        payment = Payment(
            id=self._next_id("payment"),
            invoice_id=invoice_id,
            amount=payment_amount,
            paid_on=paid_on or date.today(),
        )
        self.payments[payment.id] = payment
        self.invoices[invoice_id] = Invoice(
            id=invoice.id,
            subscription_id=invoice.subscription_id,
            amount_due=invoice.amount_due,
            issued_on=invoice.issued_on,
            status="paid",
        )
        return payment

    def revenue_report(self, start_date: date, end_date: date) -> dict[str, Decimal | int]:
        if end_date < start_date:
            raise ValueError("end_date must be on or after start_date")

        invoices_in_range = [
            invoice
            for invoice in self.invoices.values()
            if start_date <= invoice.issued_on <= end_date
        ]
        payments_by_invoice = {payment.invoice_id: payment for payment in self.payments.values()}

        total_invoiced = sum((invoice.amount_due for invoice in invoices_in_range), Decimal("0"))
        total_collected = sum(
            (payments_by_invoice[invoice.id].amount for invoice in invoices_in_range if invoice.id in payments_by_invoice),
            Decimal("0"),
        )
        outstanding_invoices = [invoice for invoice in invoices_in_range if invoice.id not in payments_by_invoice]
        outstanding_amount = sum((invoice.amount_due for invoice in outstanding_invoices), Decimal("0"))

        return {
            "total_invoiced": total_invoiced,
            "total_collected": total_collected,
            "outstanding_invoices": len(outstanding_invoices),
            "outstanding_amount": outstanding_amount,
        }
