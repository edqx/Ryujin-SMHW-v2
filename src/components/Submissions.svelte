<script>
    export let submissions;
    export let selected;

    let filter = "";
    let selected_status = "";

    let pool = submissions;

    function update() {
        pool = filter ? Object.values(submissions).filter(submission => submission.student_name.toLowerCase().indexOf(filter.toLowerCase()) !== -1) : Object.values(submissions);
        pool = selected_status ? pool.filter(submission => selected_status.toLowerCase() === submission.status) : pool;
        pool.sort((a, b) => a.student_name.toLowerCase().localeCompare(b.student_name.toLowerCase()));
    }
    
    $: filter, selected_status, submissions, update();
</script>

<div class="selector-list">
    <div class="selector-list-header">
        <input name="filter" bind:value={filter}>
        <label for="filter">Filter ({pool.length})</label>
        <select on:blur on:change={e => selected_status = e.target.options[e.target.selectedIndex].value}>
            <option value="" selected={true}>All</option>
            <option value="submitted">Submitted</option>
            <option value="not-submitted">Not Submitted</option>
            <option value="submitted-late">Submitted late</option>
        </select>
    </div>
    <div class="selector-list-table">
        <table>
            <thead>
                <tr>
                    <td></td>
                    <td>Student name</td>
                    <td>Status</td>
                    <td>Grade</td>
                </tr>
            </thead>
            <tbody>
                {#each pool as submission}
                    <tr class="submission submission-{submission.status}">
                        <td><button on:click="{() => selected = submission}">→</button></td>
                        <td>{submission.student_name}</td>
                        <td>{submission.status || "-"}</td>
                        <td>{submission.grade || "-"}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
    .submission, .submission-null {
        background-color: #f5f5f5;
    }

    .submission-not-submitted {
        background-color: #ee846a;
    }

    .submission-submitted-late {
        background-color: #ddcc98
    }

    .submission-submitted {
        background-color: #92f0bc;
    }
</style>