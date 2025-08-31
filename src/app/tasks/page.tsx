
'use client';

import TaskBoard from "@/components/tasks/task-board";
import withAuth from "@/hoc/withAuth";

function TasksPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <TaskBoard />
        </div>
    );
}

export default withAuth(TasksPage);
