# Billing and commission hardening

The billing flow now uses the historical values frozen on each order:
- `orders.price_at_order` for the client charge
- `orders.commission_at_order` for the employee commission

This means changing a client/store price or employee commission later does not rewrite old delivered orders.

## Transaction safety
Invoice creation runs in a SERIALIZABLE database transaction. Orders are linked to invoice lines and marked billed only after the full invoice operation succeeds. Concurrent attempts that overlap are rejected/retried at the API boundary instead of silently double-billing.

## Multi-employee periods
A client invoice may contain delivered orders handled by several employees. CODFlow now creates one commission invoice per employee, based only on that employee's delivered orders. It no longer pays the employee who clicked the invoice button.

## Mixed historical rates
If a billing period contains multiple historical prices/commission rates, invoice header `pricePerOrder` / `commissionPerOrder` stores the average for display while exact per-order values remain in `invoice_orders`.
