import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Admin</h1>
      <div className="grid gap-4">
        <Link href="/admin/drafts" className="block p-4 border border-gray-700 rounded hover:border-white transition">
          <h2 className="font-semibold text-white">Draft Posts</h2>
          <p className="text-sm text-gray-400">Review, edit, and publish weekly AI insights</p>
        </Link>
        <Link href="/admin/projects" className="block p-4 border border-gray-700 rounded hover:border-white transition">
          <h2 className="font-semibold text-white">Projects</h2>
          <p className="text-sm text-gray-400">Manage client project spaces and team members</p>
        </Link>
      </div>
    </div>
  )
}
