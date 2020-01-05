'use strict';
import { env, TextEditor, Uri } from 'vscode';
import {
	ActiveEditorCommand,
	command,
	CommandContext,
	Commands,
	isCommandViewContextWithCommit,
	isCommandViewContextWithFileCommit
} from './common';
import { Container } from '../container';

export interface OpenPullRequestCommandArgs {
	ref?: string;
	repoPath?: string;
}

@command()
export class OpenPullRequestCommand extends ActiveEditorCommand {
	constructor() {
		super(Commands.OpenPullRequestOnRemote);
	}

	protected preExecute(context: CommandContext, args?: OpenPullRequestCommandArgs) {
		if (isCommandViewContextWithCommit(context) || isCommandViewContextWithFileCommit(context)) {
			args = { ...args, ref: context.node.commit.sha, repoPath: context.node.commit.repoPath };
		}

		return this.execute(context.editor, context.uri, args);
	}
	async execute(editor: TextEditor | undefined, uri?: Uri, args?: OpenPullRequestCommandArgs) {
		args = { ...args };

		if (args.repoPath == null || args.ref == null) {
			return false;
		}

		const remote = await Container.git.getRemoteWithApiProvider(args.repoPath);
		if (remote?.provider == null) return false;

		const pr = await Container.git.getPullRequestForCommit(args.ref, remote.provider);
		if (pr == null) return false;

		return env.openExternal(Uri.parse(pr.url));
	}
}
