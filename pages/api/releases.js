import { getFirebaseAdmin } from 'next-firebase-auth'
import initAuth from '../../lib/firebase/initAuth'
import semver from 'semver'
import { postToJSON } from '../../lib/firebase/server/firestoreFuncs'
import initMiddleware from '../../lib/initMiddleware'
import Cors from 'cors'

initAuth()

const cors = initMiddleware(
  Cors({
    origin: '*',
    methods: ['GET', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Authorization'],
  })
)

const handler = async (req, res) => {
  await cors(req, res)

  try {
    let { latestOnly = false, name, author } = req.query

    if (name !== undefined) name = decodeURI(name)

    if (author !== undefined) author = decodeURI(author)

    const snapshot = await getFirebaseAdmin()
      .firestore()
      .collectionGroup('plugins')
      .get()
    let latestVersions = []
    let docs = []
    snapshot.docs.forEach(doc => {
      if (name && !doc.id.includes(name)) {
        return
      }
      const data = postToJSON(doc)
      const name1 = doc.id.split('_v')[0]
      const version = doc.id.split('_v')[1]
      if (data.releaseStatus <= 1) {
        // ignore drafts
        return
      }
      if (author && data.author !== author) {
        return
      }
      if (latestOnly === true) {
        if (
          latestVersions[name1] === undefined ||
          semver.satisfies(version, '>' + latestVersions[name], {
            includePrerelease: true,
          })
        ) {
          latestVersions[name1] = version
          latestVersions.push(version)
          docs.push(data)
          return
        }
      }
      docs.push(data)
    })
    return res.status(200).json(docs)
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}

export default handler
