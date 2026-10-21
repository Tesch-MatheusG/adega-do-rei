import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="container-page py-8 flex gap-8 items-start">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
