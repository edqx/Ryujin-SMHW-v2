<script>
    import Submissions from "../components/Submissions.svelte"
    import HFTSubmissionInfo from "../components/HFTSubmissionInfo.svelte"
    import Comments from "../components/Comments.svelte"
    import CommentInput from "../components/CommentInput.svelte"
    import Attachments from "../components/Attachments.svelte"
    import HFTInfo from "../components/HFTInfo.svelte"

    export let client;
    export let _cache;
    export let selected_task;
    
    export let selected_submission;

    $: assignment = selected_task ? _cache.assignments[selected_task.class_task_id] : null;
    $: attachments = assignment ? Object.values(_cache.attachments).filter(attachment => assignment.attachment_ids.indexOf(attachment.id) !== -1) : [];
    $: submissions = assignment ? Object.values(_cache.submissions).filter(submission => assignment.submission_ids.indexOf(submission.id) !== -1) : [];
    $: comments = selected_submission ? Object.values(_cache.comments).filter(comment => selected_submission.comment_ids.indexOf(comment.id) !== -1) : [];
</script>

{#if assignment}
    <div class="page" id="page-selected-hft">
        <div class="page-section column" id="section-description">
            <div class="page-content-title task-title task-title-{selected_task.class_task_type.toLowerCase()}">
                {#if selected_task.class_task_type === "Homework"}
                    <a href="https://www.satchelone.com/homeworks/{assignment.id}" target="_blank"><span>{assignment.title}</span></a>
                {:else if selected_task.class_task_type === "FlexibleTask"}
                    <a href="https://www.satchelone.com/flexible-tasks/{assignment.id}" target="_blank"><span>{assignment.title}</span></a>
                {/if}
            </div>
            <div id="task-description">
                <a href="##" on:click={() => selected_task = null}>Back</a><br>
                {@html selected_task.description}<br>
                {#each assignment.web_links as web_link}
                    <a href="{web_link.url}" target="_blank">{web_link.url}</a><br>
                {/each}
            </div>
        </div>
        <div class="page-section column" id="section-information">
            <div class="page-content-title">
                <span>Information</span>
            </div>
            <HFTInfo {assignment}/>
        </div>
        <div class="page-section column" id="section-attachments">
            <div class="page-content-title">
                <span>Attachments</span>
            </div>
            <Attachments {attachments}/>
        </div>
        <div class="page-section" id="section-submissions">
            <div class="page-content">
                <div class="page-content-title">
                    <span>Submissions</span>
                </div>
                <Submissions {submissions} bind:selected={selected_submission}/>
            </div>
            <div class="page-content">
                <div class="page-content-title">
                    <span>Selected</span>
                </div>
                <HFTSubmissionInfo submission={selected_submission}/>
            </div>
            <div class="page-content">
                <div class="page-content-title">
                    <span>Comments</span>
                </div>
                <div class="scroll" style="flex:1 1 0;">
                    <Comments {comments} submission={selected_submission}/>
                </div>
                {#if selected_submission && selected_submission.student_id === client.student.id}
                    <div style="flex-direction:column;flex:1 1 0;">
                        <CommentInput submission={selected_submission}/>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    #page-selected-hft {
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		grid-template-rows: minmax(0, 3fr) minmax(0, 3fr) minmax(0, 4fr);
    }
    
    #section-description { 
        grid-area: 1 / 1 / 2 span / 1;
    }

    #task-description {
        padding: 4px;
        overflow: auto;
    }

    #section-information {
        grid-area: 1 / 2 / 1 / 2;
    }

    #section-attachments {
        grid-area: 2 / 2 / 2 / 2;
    }

    #section-submissions {
        grid-area: 3 / 1 / 3 / 2 span;
    }
</style>