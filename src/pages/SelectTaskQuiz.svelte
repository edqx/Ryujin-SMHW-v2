<script>
    import { createEventDispatcher } from 'svelte';
    
    import QuizSubmissionInfo from "../components/QuizSubmissionInfo.svelte"
    import Comments from "../components/Comments.svelte"
    import CommentInput from "../components/CommentInput.svelte"
    import Questions from "../components/Questions.svelte"
    import QuestionInfo from "../components/QuestionInfo.svelte"
    import QuizInfo from "../components/QuizInfo.svelte"

    export let client;
    export let _cache;
    export let selected_task;

    let selected_question;

    $: submission_question = submission_questions && selected_question ? submission_questions.filter(question => question.quiz_question_id === selected_question.id)[0] : null;

    $: assignment = selected_task ? _cache.assignments[selected_task.class_task_id] : null;
    $: submission = assignment ? Object.values(_cache.submissions).filter(submission => submission.student_id === client.student.id)[0] : null;
    $: questions = assignment ? Object.values(_cache.questions).filter(question => assignment.question_ids.indexOf(question.id) !== -1) : [];
    $: comments = submission ? Object.values(_cache.comments).filter(comment => submission.comment_ids.indexOf(comment.id) !== -1) : [];
    $: submission_questions = submission ? Object.values(_cache.submission_questions).filter(question => assignment.question_ids.indexOf(question.quiz_question_id) !== -1) : [];
</script>

{#if assignment}
	<div class="page" id="page-selected-quiz">
        <div class="page-section column" id="section-description">
            <div class="page-content-title task-title task-title-{selected_task.class_task_type.toLowerCase()}">
                {#if selected_task.class_task_type === "Quiz"}
                    <a href="https://www.satchelone.com/quizzes/{assignment.id}" target="_blank"><span>{assignment.title}</span></a>
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
        <div class="page-section column" id="section-questions">
            <div class="page-content-title">
                <span>Questions</span>
            </div>
            <Questions {questions} bind:selected={selected_question}/>
            <div class="page-content">
                <div class="page-content-title">
                    <span>Selected</span>
                </div>
                <div style="overflow:auto;">
                    <QuestionInfo question={selected_question} {submission_question}/>
                </div>
            </div>
        </div>
        <div class="page-section column" id="section-information">
            <div class="page-content-title">
                <span>Information</span>
            </div>
            <QuizInfo {assignment}/>
        </div>
        <div class="page-section" id="section-submissions">
            <div class="page-content">
                <div class="page-content-title">
                    <span>Submission</span>
                </div>
                {#if submission}
                    <QuizSubmissionInfo {submission} {submission_questions}/>
                {/if}
            </div>
            <div class="page-content">
                <div class="page-content-title">
                    <span>Comments</span>
                </div>
                {#if submission}
                    <div class="scroll" style="flex:1 1 0;">
                        <Comments {comments} {submission}/>
                    </div>
                    <div style="flex-direction:column;flex:1 1 0;">
                        <CommentInput {submission}/>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    #page-selected-quiz {
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		grid-template-rows: minmax(0, 4fr) minmax(0, 2fr) minmax(0, 4fr);
    }
    
    #section-description { 
        grid-area: 1 / 1 / 2 span / 1;
    }

    #task-description {
        padding: 4px;
        overflow: auto;
    }

    #section-questions {
        grid-area: 2 / 2 / 3 span / 2;
    }

    #section-information {
        grid-area: 1 / 2 / 1 / 2;
    }

    #section-submissions {
        grid-area: 3 / 1 / 3 / 1;
    }
</style>