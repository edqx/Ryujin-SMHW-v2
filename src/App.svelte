<script>
	import PageMainDash from "./pages/MainDash.svelte"
	import PageSelectTaskHFT from "./pages/SelectTaskHFT.svelte"
	import PageSelectTaskQuiz from "./pages/SelectTaskQuiz.svelte"
	import PageQuerySubmissions from "./pages/QuerySubmissions.svelte"

	const smhw = require("node-smhw");
	const { ipcRenderer } = require("electron");
	const storage = require("electron-json-storage");

	const client = new smhw.Client;

	const _cache = {
		class_groups: {},
		employees: {},
		teachers: {},
		own_teachers: {},
		users: {},
		tasks: {},
		submissions: {},
		comments: {},
		assignments: {},
		attachments: {},
		questions: {},
		submission_questions: {}
	}

	$: {
		Object.values(_cache.employees).forEach(employee => {
			if (employee.employee_type === "teacher") {
				_cache.teachers[employee.id] = employee;

				if (Object.values(_cache.class_groups).filter(class_group => class_group.teacher_ids.indexOf(employee.id) !== -1)[0]) {
					_cache.own_teachers[employee.id] = employee;
				}
			}
		});
	}

	let selected_task = null;
	$: selected_assignment = selected_task ? _cache.assignments[selected_task.id] || null : null;
	
	let selected_submission;

	function select_task() {
		console.log("Selected task.");

		if (selected_task) {
			selected_assignment = null;
			
			if (selected_task.class_task_type === "Quiz") {
				selected_task.getAssignment().then(assignment => {
					console.log("Got assignment.", assignment);

					assignment.getQuestions().then(questions => {
						console.log("Got questions.", questions);

						assignment.getSubmission().then(submission => {
							console.log("Got submission.", submission);

							submission.getComments().then(comments => {
								console.log("Got comments.", comments);

								submission.getQuestions().then(questions => {
									console.log("Got submission questions.", questions);

									questions.forEach(question => {
										_cache.submission_questions[question.id] = question;
									});
								}).catch(console.log);
								
								comments.forEach(comment => {
									_cache.comments[comment.id] = comment;
								});
							}).catch(console.log);

							_cache.submissions[submission.id] = submission;
						}).catch(console.log);

						questions.forEach(question => {
							_cache.questions[question.id] = question;
						});
					}).catch(console.log);

					_cache.assignments[assignment.id] = assignment;
				}).catch(console.log);
			} else {
				selected_task.getAssignment().then(assignment => {
					console.log("Got assignment.", assignment);

					_cache.assignments[assignment.id] = assignment;
					
					assignment.getSubmissions().then(submissions => {
						console.log("Got submissions.", submissions);

						selected_submission = submissions.filter(submission => submission.student_id === client.student.id)[0] || null;

						submissions.forEach(submission => {
							_cache.submissions[submission.id] = submission;
						});
					}).catch(console.log).finally(() => {
						assignment.getAttachments().then(attachments => {
							console.log("Got attachments.", attachments);

							attachments.forEach(attachment => {
								_cache.attachments[attachment.id] = attachment;
							});
						}).catch(console.log).finally(() => {
							assignment.getSubmissionComments().then(comments => {
								console.log("Got comments.", comments);

								comments.forEach(comment => {
									_cache.comments[comment.id] = comment;
								});
							});
						});
					});
				}).catch(console.log);
			}
		}
	}

	storage.get("auth", (err, auth) => {
		if (err) {
			console.log(err);
			return;
		}

		client.login(auth).then(() => {
			console.log("Logged in.");

			client.student.getClassGroups().then(class_groups => {
				console.log("Got class groups.", class_groups);

				client.school.getEmployees().then(employees => {
					console.log("Got employees.", employees);

					client.getTasks().then(tasks => {
						console.log("Got tasks.", tasks);

						client.getUsers(Object.values(_cache.own_teachers).map(teacher => teacher.id)).then(users => {
							console.log("Got users.", users);

							users.forEach(user => {
								_cache.users[user.id] = user;
							});
						});

						tasks.forEach(task => {
							_cache.tasks[task.id] = task;
						});
					});

					employees.forEach(employee => {
						_cache.employees[employee.id] = employee;
					});
				});

				class_groups.forEach(class_group => {
					_cache.class_groups[class_group.id] = class_group;
				});
			});
		});
	});

	let query_submissions = false;

	ipcRenderer.on("query-submissions", function () {
		query_submissions = true;
		selected_task = null;
		selected_assignment = null;
	});
</script>

<main>
	{#if selected_task}
		{#if selected_task.class_task_type === "Quiz"}
			<PageSelectTaskQuiz {client} {_cache} bind:selected_task={selected_task}/>
		{:else}
			<PageSelectTaskHFT {client} {_cache} bind:selected_task={selected_task} bind:selected_submission={selected_submission}/>
		{/if}
	{:else}
		{#if query_submissions}
			<PageQuerySubmissions {client} {_cache} bind:query_submissions={query_submissions}/>
		{:else}
			<PageMainDash {client} {_cache} bind:selected_task={selected_task} on:select_task={select_task}/>
		{/if}
	{/if}
</main>

<style>
	main {
		height: 100%;
	}
</style>