import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GH_PAT })
const owner = process.env.GITHUB_OWNER ?? 'lightouchconsulting'
const repo = process.env.GITHUB_REPO ?? 'Website'

export async function getFileContent(filePath: string): Promise<{ content: string; sha: string }> {
  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
  const file = data as { content: string; sha: string; encoding: string }
  const content = Buffer.from(file.content, 'base64').toString('utf-8')
  return { content, sha: file.sha }
}

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
  await createFile(toPath, content, message)
  try {
    await deleteFile(fromPath, `chore: remove draft after publishing ${toPath}`)
  } catch (err) {
    console.error(`[github] Published ${toPath} but failed to delete draft ${fromPath}:`, err)
    // Don't rethrow — the publish succeeded, draft cleanup can be manual
  }
}
