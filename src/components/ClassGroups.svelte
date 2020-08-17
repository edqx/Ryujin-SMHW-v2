<script>
    export let class_groups;
    export let selected;

    let filter = "";

    $: pool = filter ? Object.values(class_groups).filter(class_group => class_group.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1) : Object.values(class_groups);
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
                    <td>Year</td>
                    <td>Name</td>
                    <td>Students</td>
                </tr>
            </thead>
            <tbody>
                {#each pool as class_group}
                    <tr>
                        <td><button on:click="{() => selected = class_group}">→</button></td>
                        <td>{class_group.class_year}</td>
                        <td>{class_group.name}</td>
                        <td>{class_group.student_ids.length}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>