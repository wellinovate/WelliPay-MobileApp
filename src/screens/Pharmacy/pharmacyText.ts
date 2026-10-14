import type { ApiPharmacyOrder, RxStatus } from '../../api/patientData';

export const RX_STATUS_TEXT: Record<RxStatus, string> = {
  SUBMITTED: 'Waiting for the pharmacist',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Supplied',
};

// One plain line saying where an order is. Dispensed means the pharmacy has handed the goods over or sent them.
export function orderStatusText(o: Pick<ApiPharmacyOrder, 'status' | 'fulfilment' | 'deliveryStatus'>): string {
  if (o.status === 'CANCELLED') return 'Cancelled';
  if (o.status === 'AWAITING_DISPENSING') return o.fulfilment === 'DELIVERY' ? 'Being prepared' : 'Being prepared for pickup';
  if (o.fulfilment === 'PICKUP') return 'Collected';
  switch (o.deliveryStatus) {
    case 'PENDING': return 'Packed, waiting for a rider';
    case 'OUT_FOR_DELIVERY': return 'Out for delivery';
    case 'DELIVERED': return 'Delivered';
    case 'FAILED': return 'Delivery failed';
    default: return 'Dispensed';
  }
}

// Whether to show the delivery code. It is for the person receiving the parcel only while it is on its way.
export function showsProofCode(o: Pick<ApiPharmacyOrder, 'proofCode' | 'fulfilment' | 'deliveryStatus'>): boolean {
  return !!o.proofCode && o.fulfilment === 'DELIVERY' && (o.deliveryStatus === 'PENDING' || o.deliveryStatus === 'OUT_FOR_DELIVERY');
}
