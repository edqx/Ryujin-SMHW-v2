<script>
    import { createEventDispatcher } from "svelte";

    export let tasks;
    export let selected;

    let title = "";
    let regex = false;
    let description = false;
    let class_group = "";
    let subject = "";
    let type = "";
    let teacher = "";
    let show_past = false;

    let pool = [];

    function isoverdue(task) {
        return task.due_on + 86400000 < Date.now();
    }

    function update() {
        pool = show_past ? Object.values(tasks) : Object.values(tasks).filter(task => !task.completed || task.due_on + 86400000 > Date.now());

        if (title) {
            if (description) {
                pool = pool.filter(task => (task.class_task_title.toLowerCase() + (task.description ? " " + task.description.toLowerCase() : "")).indexOf(title.toLowerCase()) !== -1);
            } else {
                pool = pool.filter(task => task.class_task_title.toLowerCase().indexOf(title.toLowerCase()) !== -1);
            }
        }

        pool = class_group ? pool.filter(task => task.class_group_name.toLowerCase().indexOf(class_group.toLowerCase()) !== -1) : pool;
        pool = subject ? pool.filter(task => task.subject.toLowerCase().indexOf(subject.toLowerCase()) !== -1) : pool;
        pool = type ? pool.filter(task => task.class_task_type === type) : pool;
        pool = teacher ? pool.filter(task => task.teacher_name.toLowerCase().indexOf(teacher.toLowerCase()) !== -1) : pool;
        
        pool.sort((a, b) => a.due_on - b.due_on);
    }

    $: if (tasks || title || regex || description || class_group || subject || type || teacher || show_past || 1) update();

    const dispatch = createEventDispatcher();

    function select_task(task) {
        selected = task;

        dispatch("select_task", {
            task: task
        });
    }
</script>

<div class="selector-list">
    <div class="selector-list-header">
        <fieldset>
            <legend>Filter ({pool.length})</legend>
            <input name="filter" bind:value={title}> <label for="filter">Filter</label><br>
            <input type="checkbox" name="description" bind:checked={description}> <label for="description">Match description?</label><br>
            <input name="class-group" bind:value={class_group}> <label for="class-group">Class group</label><br><br>
            <input name="subject" bind:value={subject}> <label for="subject">Subject</label>
            <select on:blur on:change={e => type = e.target.options[e.target.selectedIndex].value}>
                <option selected={true} value="">All</option>
                <option value="Homework">Homeworks</option>
                <option value="FlexibleTask">Flexible Tasks</option>
                <option value="Quiz">Quizzes</option>
                <option value="SpellingTest">Spelling Tests</option>
            </select><br><br>
            <input name="teacher" bind:value={teacher}> <label for="teacher">Teacher</label>
            <input type="checkbox" name="show-past" bind:checked={show_past}> <label for="show-past">Show past?</label><br>
        </fieldset>
    </div>
    <div class="selector-list-table">
        <table>
            <thead>
                <tr>
                    <td></td>
                    <td></td>
                    <td>Due on</td>
                    <td>Class group</td>
                    <td>Subject</td>
                    <td>Teacher</td>
                    <td>Title</td>
                </tr>
            </thead>
            <tbody>
                {#each pool as task, i}
                    <tr class="task-{task.class_task_type.toLowerCase()}{!show_past && pool[i + 1] && isoverdue(task) && !isoverdue(pool[i + 1]) ? " task-separator" : ""}">
                        <td><button on:click={() => select_task(task)}>→</button></td>
                        <td><input type="checkbox" bind:checked={task.completed} on:change={e => task.setCompleted(e.target.checked)}/></td>
                        {#if task.completed}
                            <td><s>{new Date(task.due_on).toLocaleDateString()}</s></td>
                            <td><s>{task.class_group_name}</s></td>
                            <td><s>{task.subject}</s></td>
                            <td><s>{task.teacher_name}</s></td>
                            <td><s>{task.class_task_title}</s></td>
                        {:else}
                            <td>{new Date(task.due_on).toLocaleDateString()}</td>
                            <td>{task.class_group_name}</td>
                            <td>{task.subject}</td>
                            <td>{task.teacher_name}</td>
                            <td>{task.class_task_title}</td>
                        {/if}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .task-homework {
        background-color: #a3c1d9;
    }

    .task-flexibletask {
        background-color: #ddcc98;
    }

    .task-quiz {
        background-color: #fecbd2;
    }

    .task-spellingtest {
        background-color: #bec5cb;
    }

    .task-classtest {
        background-color: #b1cc9f;
    }

    .task-separator {
        border-bottom: 1px solid #f4ac90;
    }
</style>