<script>
    export let assignment;
</script>

{#if assignment}
    <span>ID: {assignment.id}</span>
    <span>Title: {assignment.title}</span>
    <span>Teacher: {assignment.teacher_name}</span>
    <span>Group: {assignment.class_group_name}</span>
    <span>Year: {assignment.class_year}</span>
    <span>Type: {assignment.type}</span>
    <span>Issued: {new Date(assignment.issued_on).toLocaleDateString()}</span>
    <span>Due: {new Date(assignment.due_on).toLocaleDateString()}</span>
    <span>Questions: {assignment.question_ids.length}</span>
    <span>Random order: {assignment.random_order}</span>
    <span>Time limit: {assignment.questions_time_limit}</span>
{/if}