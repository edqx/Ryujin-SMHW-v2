<script>
	import { createEventDispatcher } from 'svelte';
    
    export let _cache;
    export let client;

    client; // removes annoying yellow line

	import ClassGroups from "../components/ClassGroups.svelte"
	import ClassGroupInfo from "../components/ClassGroupInfo.svelte"
	import Teachers from "../components/Teachers.svelte"
    import TeacherInfo from "../components/TeacherInfo.svelte"

    import Tasks from "../components/Tasks.svelte"
    
	let selected_class_group = null;
    let selected_teacher = null;

    export let selected_task;
    
    const dispatch = createEventDispatcher();

    function select_task(task) {
        dispatch("select_task", {
            task: task
        });
    }

    $: selected_teacher_user = selected_teacher ? _cache.users[selected_teacher.id] : null;
</script>

<div class="page" id="page-main-dash">
    <div class="page-section column" id="section-tasks">
        <div class="page-content-title">
            <span>Tasks</span>
        </div>
        <Tasks tasks={_cache.tasks} bind:selected={selected_task} on:select_task={select_task}/>
    </div>
    <div class="page-section column" id="section-teachers">
        <div class="page-content-title">
            <span>Teachers</span>
        </div>
        <Teachers teachers={_cache.own_teachers} users={Object.values(_cache.users)} bind:selected={selected_teacher}/>
        <div class="page-content">
            <div class="page-content-title">
                <span>Selected</span>
            </div>
            <TeacherInfo teacher={selected_teacher} user={selected_teacher_user}/>
        </div>
    </div>
    <div class="page-section column" id="section-classes">
        <div class="page-content-title">
            <span>Class Groups</span>
        </div>
        <ClassGroups class_groups={_cache.class_groups} bind:selected={selected_class_group}/>
        <div class="page-content">
            <div class="page-content-title">
                <span>Selected</span>
            </div>
            <ClassGroupInfo class_group={selected_class_group}/>
        </div>
    </div>
</div>

<style>
    #page-main-dash {
        grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
        grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    }
        
    #section-tasks {
        grid-area: 1 / 1 / 2 span / 1;
    }

    #section-teachers {
        grid-area: 1 / 2 / 1 / 2;
    }

    #section-classes {
        grid-area: 2 / 2 / 2 / 2;
    }
</style>