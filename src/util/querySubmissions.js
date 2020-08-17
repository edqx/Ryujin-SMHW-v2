export function querySubmissions(client, tasks) {
    return new Promise((resolve, reject) => {
        const homework_ids = tasks.filter(task => task.class_task_type === "Homework").map(task => task.id);
        const flexible_task_ids = tasks.filter(task => task.class_task_type === "FlexibleTask").map(task => task.id);
        const homework_submission_ids = [];
        const flexible_task_submission_ids = [];

        const information = {
            submissions: [],
            tasks: []
        }

        client.getHomeworks(homework_ids).then(homeworks => {
            information.tasks.push(...homeworks);
            
            homeworks.map(homework => homework.submission_ids).forEach(submissions => {
                homework_submission_ids.push(...submissions);
            });
        }).catch(console.log).finally(() => {
            client.getFlexibleTasks(flexible_task_ids).then(flexible_tasks => {
                information.tasks.push(...flexible_tasks);
                
                flexible_tasks.map(flexible_task => flexible_task.submission_ids).forEach(submissions => {
                    flexible_task_submission_ids.push(...submissions);
                });
            }).catch(console.log).finally(() => {
                client.getHomeworkSubmissions(homework_submission_ids).then(submissions => {
                    information.submissions.push(...submissions);
                }).catch(console.log).finally(() => {
                    client.getFlexibleTaskSubmissions(flexible_task_submission_ids).then(submissions => {
                        information.submissions.push(...submissions);
                    }).catch(console.log).finally(() => {
                        resolve(information);
                    });
                });
            });
        });
    });
}