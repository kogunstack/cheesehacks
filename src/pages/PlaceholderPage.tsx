interface PlaceholderPageProps {
    title: string;
    icon: React.ReactNode;
}

export default function PlaceholderPage({ title, icon }: PlaceholderPageProps) {
    return (
        <div className="flex-1 flex items-center justify-center bg-[var(--color-surface)]">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    {icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-sm font-medium text-indigo-600">Coming soon</span>
                </div>
                <p className="text-gray-400 text-sm mt-4 max-w-xs mx-auto">
                    This feature is currently under development. Stay tuned for updates!
                </p>
            </div>
        </div>
    );
}
