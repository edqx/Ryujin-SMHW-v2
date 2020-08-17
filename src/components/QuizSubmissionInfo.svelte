<script>
    export let submission;
    export let submission_questions;

    $: attempt1 = Math.floor(submission_questions.filter(question => question.attempt1 && question.attempt1.correct).length / submission_questions.length * 100);
    $: attempt2 = Math.floor(submission_questions.filter(question => question.attempt2 && question.attempt2.correct).length / submission_questions.length * 100);
    $: attempt3 = Math.floor(submission_questions.filter(question => question.attempt3 && question.attempt3.correct).length / submission_questions.length * 100);
</script>

{#if submission}
    <div style="padding:4px;">
        <div style="float:right;text-align:right;">
            <img class="avatar" src="{submission.student_avatar || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}" alt="avatar" width=96 height=96/><br>
            <span>Student avatar</span>
        </div>
        <span>ID: {submission.id}</span><br>
        <span>Student ID: {submission.student_id}</span><br>
        <span>Student name: {submission.student_name}</span><br>
        <span>Status: {submission.status}</span><br>
        <span>Score: {submission.grade || "-"}</span><br>
        <span>Attempt 1: {attempt1 || "0"}%</span><br>
        <span>Attempt 2: {attempt2 || "0"}%</span><br>
        <span>Attempt 3: {attempt3 || "0"}%</span><br>
    </div>
{/if}