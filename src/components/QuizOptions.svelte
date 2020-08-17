<script>
    export let quiz;
    export let options;
</script>

<div>
    <h2>Hacks</h2>
    <input type="checkbox" bind:checked={options.hacks.infiniteTime} name="infinite-time">
    <label for="infinite-time">Infinite Time?</label>
</div>
