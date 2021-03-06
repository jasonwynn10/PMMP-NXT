import { AuthAction, getFirebaseAdmin, withAuthUser } from 'next-firebase-auth'
import PluginCard from '../components/PluginCard'
import Metatags from '../components/Metatags'
import { postToJSON } from '../lib/firebase/server/firestoreFuncs'

const Review = ({ data }) => {
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
      <ul
        className={
          'p-2 flex flex-wrap gap-x-5 gap-y-10 justify-center lg:justify-start'
        }>
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
      .where('releaseStatus', '==', 1)
      .get()
    for (const doc of snapshot.docs) {
      const userDoc = await doc.ref.parent.parent.get()
      const recentPlugins = userDoc.get('recentSubmissions')
      if (!doc.id in recentPlugins) continue
      const data = postToJSON(doc)
      docs.push(data)
    }
  } catch (e) {
    console.log(e)
  }
  return {
    props: {
      data: docs,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most 4 times every day
    revalidate: 21600, // 6 hours in seconds
  }
}

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(Review)
