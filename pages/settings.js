import { AuthAction, withAuthUser } from 'next-firebase-auth'
import Metatags from '../components/Metatags'

const Settings = () => {
  return (
    <>
      <Metatags title='Settings' />
      <ul className={'w-full flex flex-wrap justify-center lg:justify-start'}>
        <li />
      </ul>
    </>
  )
}

export default withAuthUser({
  whenUnauthedBeforeInit: AuthAction.REDIRECT_TO_LOGIN,
})(Settings)