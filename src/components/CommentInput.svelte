<script>
    export let submission;

    let comment;
</script>

<textarea bind:value={comment} placeholder="Add a comment.."></textarea>
<button class="comment" on:click={() => submission.postComment(comment)}>Submit</button>

<style>
* {
    width: 100%;
}
</style>
