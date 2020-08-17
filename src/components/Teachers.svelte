<script>
    export let teachers;
    export let users;
    export let selected;
    
    let filter = "";

    $: pool = filter ? Object.values(teachers).filter(teacher => teacher.surname.toLowerCase().indexOf(filter.toLowerCase()) !== -1) : Object.values(teachers);
    $: pool.sort((a, b) => a.surname.toLowerCase().localeCompare(b.surname.toLowerCase()));
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
                    <td>Title</td>
                    <td>Forename</td>
                    <td>Surname</td>
                </tr>
            </thead>
            <tbody>
                {#each pool as teacher}
                    <tr>
                        <td><button on:click="{() => selected = teacher}">→</button></td>
                        <td>{teacher.title}</td>
                        <td>{users[teacher.id] ? users[teacher.id].forename : teacher.forename}</td>
                        <td>{teacher.surname}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>