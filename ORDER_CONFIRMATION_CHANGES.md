# Order confirmation workflow changes

Added a clear call-outcome workflow to the Orders detail panel.

## What changed
- Added prominent actions: Confirmed, No Answer, Callback, Cancelled.
- Added tap-to-call button next to the call-outcome section.
- Recording a call result now updates the order status in the same backend request.
- Added callback date/time selection and callback record creation.
- Added callback notification for the assigned employee.
- Added translated labels in Arabic, French, and English.
- Kept `confirmed` as a real visible order state. The order is no longer moved to `sent_to_delivery` before a real delivery API shipment succeeds.
- Added mobile-friendly styling for confirmation actions.

## Important
Automatic delivery shipment creation is still a separate integration task. A confirmed order now remains Confirmed until a real shipment creation succeeds.
