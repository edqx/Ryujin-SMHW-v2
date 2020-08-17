<script>
    export let question;
    export let submission_question;

    let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
</script>

{#if question}
    <span>ID: {question.id}</span><br>
    <span>Question: {question.description}</span>
    <table>
        <thead>
            <td>#</td>
            <td>Attempts</td>
            <td>Option</td>
        </thead>
        <tbody>
            {#each question.options as option, i}
                <tr class="{option === question.correct_answer ? "option-correct" : "option-wrong"}">
                    <td>{chars[i]}</td>
                    <td>
                        {#if submission_question}
                            {submission_question.attempt1 && submission_question.attempt1.answer === option ? "1" : ""}
                            {submission_question.attempt2 && submission_question.attempt2.answer === option ? "2" : ""}
                            {submission_question.attempt3 && submission_question.attempt3.answer === option ? "3" : ""}
                        {/if}
                    </td>
                    <td>{option}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<style>
    table {
        overflow: auto;
    }

    .option-correct {
        background-color: #b5ead7;
    }

    .option-wrong {
        background-color: #ee846a;
    }
</style>