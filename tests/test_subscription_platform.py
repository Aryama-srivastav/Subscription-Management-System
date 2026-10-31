from datetime import date
from decimal import Decimal
import unittest

from subscription_platform import SubscriptionPlatform


class SubscriptionPlatformTests(unittest.TestCase):
    def test_full_subscription_lifecycle_and_reporting(self) -> None:
        platform = SubscriptionPlatform()
        product = platform.create_product("Video Streaming")
        plan = platform.create_plan(product.id, "Premium Monthly", "29.99")
        customer = platform.create_customer("Taylor", "taylor@example.com")
        subscription = platform.start_subscription(customer.id, plan.id)

        invoice = platform.generate_invoice(subscription.id, issued_on=date(2026, 10, 1))
        payment = platform.record_payment(invoice.id, paid_on=date(2026, 10, 3))
        report = platform.revenue_report(date(2026, 10, 1), date(2026, 10, 31))

        self.assertEqual(invoice.amount_due, Decimal("29.99"))
        self.assertEqual(payment.amount, Decimal("29.99"))
        self.assertEqual(report["total_invoiced"], Decimal("29.99"))
        self.assertEqual(report["total_collected"], Decimal("29.99"))
        self.assertEqual(report["outstanding_invoices"], 0)
        self.assertEqual(report["outstanding_amount"], Decimal("0"))

    def test_cancelled_subscription_cannot_be_invoiced(self) -> None:
        platform = SubscriptionPlatform()
        product = platform.create_product("Cloud Storage")
        plan = platform.create_plan(product.id, "Starter", "9.99")
        customer = platform.create_customer("Morgan", "morgan@example.com")
        subscription = platform.start_subscription(customer.id, plan.id)
        platform.cancel_subscription(subscription.id)

        with self.assertRaises(ValueError):
            platform.generate_invoice(subscription.id)


if __name__ == "__main__":
    unittest.main()
