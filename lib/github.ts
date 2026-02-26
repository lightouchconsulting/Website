import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GH_PAT })
const owner = process.env.GITHUB_OWNER ?? 'lightouchconsulting'
const repo = process.env.GITHUB_REPO ?? 'Website'

export async function createFile(filePath: string, content: string, message: string) {
  await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: filePath,
    message,
    content: Buffer.from(content).toString('base64'),
  })
}

export async function updateFile(filePath: string, content: string, message: string) {
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
  const sha = (data as { sha: string }).sha
  await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: filePath,
    message,
    sha,
    content: Buffer.from(content).toString('base64'),
  })
}

export async function deleteFile(filePath: string, message: string) {
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
  const sha = (data as { sha: string }).sha
  await octokit.repos.deleteFile({ owner, repo, path: filePath, message, sha })
}

export async function moveFile(fromPath: string, toPath: string, content: string, message: string) {
  // GitHub API has no move — create at new path, delete from old path
  await createFile(toPath, content, message)
  await deleteFile(fromPath, `chore: remove draft after publishing ${toPath}`)
}
