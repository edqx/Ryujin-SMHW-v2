<script>
    export let class_group;
</script>

{#if class_group}
    <span>ID: {class_group.id}</span>
    <span>Year: {class_group.class_year}</span>
    <span>Name: {class_group.name}</span>
    <span>Students: {class_group.student_ids.length}</span>
    <span>Teachers: {class_group.teacher_ids.length}</span>
{/if}