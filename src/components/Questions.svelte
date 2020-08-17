<script>
    export let questions;
    // export let submission_questions;
    export let selected = null;

    let filter = "";

    $: pool = filter ? Object.values(questions).filter(question => question.description.toLowerCase().indexOf(filter.toLowerCase()) !== -1) : Object.values(questions);
</script>

<div class="selector-list">
    <div class="selector-list-header">
        <input name="filter" bind:value={filter}>
        <label for="filter">Filter ({pool.length})</label>
    </div>
    <div class="selector-list-table">
        <table>
            <thead>
                <tr>
                    <td></td>
                    <td>#</td>
                    <!--<td>Attempts</td>-->
                    <td>Question</td>
                </tr>
            </thead>
            <tbody>
                {#each pool as question, i}
                    <tr >
                        <td><button on:click="{() => selected = question}">→</button></td>
                        <td>{i + 1}</td>
                        <!--<td>
                            {#if submission_questions[i]}
                                {submission_questions[i].attempt1 && submission_questions[i].attempt1.correct ? "1" : ""}
                                {submission_questions[i].attempt2 && submission_questions[i].attempt2.correct ? "2" : ""}
                                {submission_questions[i].attempt3 && submission_questions[i].attempt3.correct ? "3" : ""}
                            {/if}
                        </td>-->
                        <td>{question.description}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>