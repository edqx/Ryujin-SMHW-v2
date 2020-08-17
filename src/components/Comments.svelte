<script>
    export let comments;
    export let submission = null;
</script>

{#each comments as comment}
    <p class="{submission ? (comment.user_id === submission.student_id ? "out" : "in") : ""}"><b>{comment.user_name} @ {new Date(comment.created_at).toISOString()}:</b> {comment.text}</p>
{/each}

<style>
    .out {
        background-color: #b6b9ff;
    }

    .in {
        background-color: #b5ead7;
    }
</style>