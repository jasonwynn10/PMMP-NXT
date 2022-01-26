import { getFirebaseAdmin, withAuthUser } from 'next-firebase-auth'
import Metatags from '../components/Metatags'
import PluginCard from '../components/PluginCard'
import { postToJSON } from '../lib/firebase/server/firestoreFuncs'
import semver from 'semver'

const Home = ({ data = [] }) => {
  data = data.map(doc => (
    <PluginCard
      key={doc.id}
      name={doc.id}
      author={doc.author}
      tagline={doc.tagline}
      iconUrl={doc.iconUrl}
      downloadUrl={doc.downloadUrl}
    />
  ))

  return (
    <>
      <Metatags
        title='Home'
        tagline={'Currently showing ' + data.length + ' reviewed plugins'}
      />
      <ul className={'w-full flex flex-wrap justify-center lg:justify-start'}>
        {data}
      </ul>
    </>
  )
}

export async function getStaticProps(context) {
  const docs = []
  try {
    const snapshot = await getFirebaseAdmin()
      .firestore()
      .collectionGroup('plugins')
      .where('releaseStatus', '==', '2')
      .get()
    let latestVersions = []
    snapshot.docs.forEach(doc => {
      const data = postToJSON(doc)
      const name = doc.id.split('_v')[0]
      const version = doc.id.split('_v')[1]
      if (
        latestVersions[name] === undefined ||
        semver.satisfies(version, '>' + latestVersions[name], {
          includePrerelease: true,
        })
      ) {
        latestVersions[name] = version
        latestVersions.push(version)
        docs.push(data)
        return
      }
      docs.push(data)
    })
  } catch (e) {
    console.log(e)
  }
  return {
    props: {
      data: docs,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every day
    revalidate: 86400, // 1 day in seconds
  }
}

export default withAuthUser()(Home)
