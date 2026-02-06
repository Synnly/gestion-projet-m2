export function TopicHeaderSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-base-300 rounded w-3/4"></div>
            <div className="flex items-center gap-3">
                <div className="bg-base-300 rounded-full w-8 h-8"></div>
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-base-300 rounded w-32"></div>
                    <div className="h-3 bg-base-300 rounded w-48"></div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-base-300 rounded w-full"></div>
                <div className="h-3 bg-base-300 rounded w-5/6"></div>
            </div>
        </div>
    );
}
