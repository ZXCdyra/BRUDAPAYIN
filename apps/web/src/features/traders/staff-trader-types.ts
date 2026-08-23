export interface StaffTraderRow {
  id: string;
  name: string;
  login: string;
  status: string;
  activeRequisitesCount: number;
  totalVolume: number;
  ordersCount: number;
  payoutMinLimit?: number;
  payoutMaxLimit?: number;
}
