<script>
    import SelectTasks from "../components/SelectTasks.svelte"
    import SubmissionQueryInformation from "../components/SubmissionQueryInformation.svelte"
    import { querySubmissions } from "../util/querySubmissions.js"

    export let _cache;
    export let client;
    export let query_submissions;

    let selected_tasks = [];
    let information = null;
</script>

<div class="page" id="page-query-submissions">
    <div class="page-section column" id="section-tasks">
        <div class="page-content-title">
            <span>Select Tasks</span>
        </div>
        <a href="##" on:click={() => query_submissions = false}>Back</a>
        <SelectTasks tasks={_cache.tasks} bind:selected={selected_tasks} max=10/>
    </div>
    <div class="page-section" id="section-query">
        <div class="page-content">
            <div class="page-content-title">
                <span>Query</span>
            </div>
            <div>
                <button
                    disabled={selected_tasks.length === 0}
                    on:click={() => querySubmissions(client, selected_tasks).then(info => information = info)}
                >
                    Query {selected_tasks.length} Task{selected_tasks.length === 1 ? "" : "s"}..
                </button>
            </div>
        </div>
        <div class="page-content">
            <div class="page-content-title">
                <span>Submissions</span>
            </div>
            {#if information}
                <SubmissionQueryInformation submissions={information.submissions}/>
            {/if}
        </div>
    </div>
</div>

<style>
    #page-query-submissions {
        grid-template-rows: minmax(0, 5fr) minmax(0, 2fr);
        grid-template-columns: minmax(0, 1fr);
    }

    #section-tasks {
        grid-area: 1 / 1 / 1 / 1;
    }

    #section-query {
        grid-area: 2 / 1 / 2 / 1;
    }
</style>