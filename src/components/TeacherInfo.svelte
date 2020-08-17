<script>
    export let teacher;
    export let user;
</script>

{#if teacher}
    <div style="padding:4px;">
        <div style="float:right;text-align:right;">
            <img class="avatar" src="{(user ? user.avatar : null) || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}" alt="avatar" width=96 height=96/><br>
            <span>User avatar</span>
        </div>
        <span>ID: {teacher.id}</span><br>
        {#if user}
            <span>Sims ID: {user.sims_id}</span><br>
        {/if}
        <span>Title: {teacher.title}</span><br>
        <span>Forename: {user ? user.forename : teacher.forename}</span><br>
        <span>Surname: {teacher.surname}</span><br>
        {#if user}
            <span>Joined at: {new Date(user.created_at).toLocaleDateString()}</span><br>
        {/if}
    </div>
{/if}