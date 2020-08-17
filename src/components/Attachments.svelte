<script>
    import { formatBytes } from "../util/formatBytes.js"
    import { downloadAttachment } from "../util/downloadAttachment.js"

    export let attachments;

    let filter = "";

    $: pool = filter ? Object.values(attachments).filter(attachment => attachment.filename.toLowerCase().indexOf(filter.toLowerCase()) !== -1) : Object.values(attachments);
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
                    <td>Filename</td>
                    <td>Size</td>
                </tr>
            </thead>
            <tbody>
                {#each pool as attachment}
                    <tr>
                        <td><button on:click="{() => downloadAttachment(attachment)}">⭳</button></td>
                        <td>{attachment.filename}</td>
                        <td>{formatBytes(attachment.file_size)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>