<script>
    export let submission;
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
        <span>Grade: {submission.grade || "-"}</span><br>
        <span>Handed in on: {submission.handed_in_on ? new Date(submission.handed_in_on).toLocaleDateString() : ""}</span><br>
        <span>Overdue: {submission.overdue}</span>
    </div>
{/if}