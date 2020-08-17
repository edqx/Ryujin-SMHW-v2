<script>
    export let submissions;

    $: resolved = submissions.filter(submission => submission.status);
    $: completed = resolved.filter(submission => submission.status === "submitted" || submission.status === "submitted-late");
    $: late = completed.filter(submission => submission.status === "submitted-late");
</script>

<div>
    <span>Total submissions: {submissions.length}</span><br>
    <span>Of which resolved: {resolved.length} ({Math.floor(resolved.length / submissions.length * 100) || 0}%)</span><br>
    <span>Of which submitted: {completed.length} ({Math.floor(completed.length / resolved.length * 100) || 0}%)</span><br>
    <span>Of which late: {late.length} ({Math.floor(late.length / completed.length * 100) || 0}%)</span><br>
</div>