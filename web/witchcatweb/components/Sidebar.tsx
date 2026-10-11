export default function Sidebar() {
  return (
    <aside className="space-y-6">
      {/* Featured Card 1 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="aspect-[3/4] bg-gradient-to-br from-orange-200 to-pink-200 dark:from-orange-900 dark:to-pink-900"></div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Featured Character
          </p>
        </div>
      </div>

      {/* Featured Card 2 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="aspect-[3/4] bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900"></div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Site Owner
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            you have to go and see...
          </p>
        </div>
      </div>
    </aside>
  );
}
