import { useAuthUser, withAuthUser } from 'next-firebase-auth'
import Metatags from '../components/Metatags'
import { useEffect, useRef, useState } from 'react'
import semantic from 'semver'
import IdentifyRepoHost from '../lib/repo_hosts/identifyRepoHost'
import Image from 'next/image'
import githubMark from '../public/icons/GitHub-Mark.svg'
import gitlabIcon from '../public/icons/GitLab-Icon.svg'
import bitbucketMark from '../public/icons/Bitbucket-Mark.svg'
import { Button, Step, StepContent, StepLabel, Stepper } from '@mui/material'
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from 'firebase/firestore'
import { getApp } from 'firebase/app'
import {
  signInWithBitbucket,
  signInWithGitHub,
  signInWithGitLab,
} from '../lib/signIn'
import { Web, WebOutlined } from '@mui/icons-material'

const Publish = () => {
  const finalUrl = useRef('')
  const finalTag = useRef('')
  const finalPath = useRef('')
  const finalManifestContents = useRef('')
  const finalEnableDescription = useRef(true)
  const finalDescriptionContents = useRef('')
  const finalEnableChangelog = useRef(true)
  const finalChangelogContents = useRef('')

  const [page, setPage] = useState(0)

  return (
    <>
      <Metatags
        title='Publish'
        tagline='Release your first plugin today!'
        //TODO: upload arrow image
      />
      <div className={'w-full h-full flex justify-center'}>
        {page === 0 && (
          <StepperForm
            finalUrl={finalUrl}
            finalTag={finalTag}
            finalPath={finalPath}
            finalManifestContents={finalManifestContents}
            finalEnableDescription={finalEnableDescription}
            finalDescriptionContents={finalDescriptionContents}
            finalEnableChangelog={finalEnableChangelog}
            finalChangelogContents={finalChangelogContents}
            setPage={setPage}
          />
        )}
      </div>
    </>
  )
}

export default withAuthUser()(Publish)

const regExp =
  /^(?:http[s]?:\/\/)?((?:[a-zA-Z0-9][-a-zA-Z0-9]{0,61}[a-zA-Z0-9]?\.)?[a-zA-Z0-9]{1,2}(?:[-a-zA-Z0-9]{0,252}[a-zA-Z0-9])?)\.[a-zA-Z]{2,63}(?:\/|^).*/im

const StepperForm = ({
  finalUrl,
  finalTag,
  finalPath,
  finalManifestContents,
  finalEnableDescription,
  finalDescriptionContents,
  finalEnableChangelog,
  finalChangelogContents,
  setPage,
}) => {
  const authUser = useAuthUser()
  const gitToken = useRef(null)

  const finalOptions = useRef([])

  // STEPPER
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (!authUser.id) return
    const getAuthToken = async () => {
      const tokensRef = await getDocs(
        query(
          collection(getFirestore(getApp()), 'tokens'),
          where('uid', '==', authUser.id),
          where('host', '==', 'github'),
          limit(1)
        )
      )
      if (tokensRef.docs.length > 0) gitToken.current = tokensRef.docs[0].id
    }
    getAuthToken()
    if (
      authUser.firebaseUser?.providerData.some(({ providerId }) => {
        return providerId === 'github.com'
      })
    )
      handleNext()
  }, [authUser])

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  return (
    <form
      className={
        'w-full max-w-4xl my-4 px-3 py-1 text-base bg-white rounded-2xl drop-shadow-lg dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700'
      }>
      <Stepper activeStep={activeStep} orientation='vertical'>
        <Step>
          <StepLabel>
            <h3 className={'font-semibold text-lg dark:text-white'}>
              Sign in to your Repo Host
            </h3>
          </StepLabel>
          <StepContent>
            <SignInStep handleNext={handleNext} />
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <h3 className={'font-semibold text-lg dark:text-white'}>
              Choose a repository
            </h3>
          </StepLabel>
          <StepContent>
            <ChooseARepo
              authUser={authUser}
              finalUrl={finalUrl}
              finalTag={finalTag}
              finalOptions={finalOptions}
              auth={gitToken.current}
              handleNext={handleNext}
              handleBack={handleBack}
            />
          </StepContent>
        </Step>
        <Step>
          <StepLabel>
            <h3 className={'font-semibold text-lg dark:text-white'}>
              Choose a Release
              {finalManifestContents.current === '' ? ' and Path' : ''}
            </h3>
          </StepLabel>
          <StepContent>
            <ChooseATag
              url={finalUrl.current}
              finalTag={finalTag}
              finalOptions={finalOptions}
              finalPath={finalPath}
              finalManifestContents={finalManifestContents}
              finalEnableDescription={finalEnableDescription}
              finalDescriptionContents={finalDescriptionContents}
              finalEnableChangelog={finalEnableChangelog}
              finalChangelogContents={finalChangelogContents}
              auth={gitToken.current}
              handleNext={handleNext}
              handleBack={handleBack}
            />
          </StepContent>
        </Step>
        <Step>
          <StepLabel
            optional={
              <p className={'font-thin text-sm dark:text-white'}>Last step</p>
            }>
            <h3 className={'font-semibold text-lg dark:text-white'}>
              Choose your imports
            </h3>
          </StepLabel>
          <StepContent>
            <FinalStep
              manifestContents={finalManifestContents.current}
              finalEnableChangelog={finalEnableChangelog}
              descriptionContents={finalDescriptionContents.current}
              finalEnableDescription={finalEnableDescription}
              changelogContents={finalChangelogContents.current}
              setPage={setPage}
              handleBack={handleBack}
            />
          </StepContent>
        </Step>
      </Stepper>
    </form>
  )
}

const SignInStep = ({ handleNext }) => {
  const authUser = useAuthUser()
  return (
    <>
      <div className={'min-w-fit flex flex-wrap'}>
        <button
          onClick={() => signInWithGitHub().then(handleNext)}
          className='max-w-sm text-white bg-[#24292F] hover:bg-[#24292F]/90 focus:ring-4 focus:ring-[#24292F]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 inline-flex items-center justify-center dark:focus:ring-zinc-500 dark:hover:bg-[#414a55] mr-2 mb-2'>
          <div className={'mr-2 -ml-1 w-4 h-4'}>
            <Image src={githubMark} alt={'Github Mark'} />
          </div>
          Sign in with GitHub
        </button>
        <button
          onClick={() => signInWithGitLab().then(handleNext)}
          disabled={true}
          className='hidden max-w-sm text-white bg-[#c6592a] hover:bg-[#ec6a32]/90 focus:ring-4 focus:ring-[#24292F]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 inline-flex items-center justify-center dark:focus:ring-zinc-500 dark:hover:bg-[#ec6a32] mr-2 mb-2'>
          <div className={'mr-2 -ml-1 w-4 h-4'}>
            <Image src={gitlabIcon} alt={'GitLab Icon'} />
          </div>
          Sign in with GitLab
        </button>
        <button
          onClick={() => signInWithBitbucket().then(handleNext)}
          disabled={true}
          className='hidden max-w-sm text-white bg-[#0747a6] hover:bg-[#0a67f2]/90 focus:ring-4 focus:ring-[#24292F]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 inline-flex items-center justify-center dark:focus:ring-zinc-500 dark:hover:bg-[#0a67f2] mr-2 mb-2'>
          <div className={'mr-2 -ml-1 w-4 h-4'}>
            <Image src={bitbucketMark} alt={'Bitbucket Mark'} />
          </div>
          Sign in with Bitbucket
        </button>
      </div>
      <StepperButtons
        disabledNext={!authUser.firebaseUser}
        disabledBack={true}
        onNext={handleNext}
      />
    </>
  )
}

const ChooseARepo = ({
  authUser,
  finalUrl,
  finalTag,
  finalOptions,
  auth,
  handleNext,
  handleBack,
}) => {
  const [url, setUrl] = useState(finalUrl.current)

  return (
    <>
      <fieldset className={'w-full max-w-lg flex flex-col'}>
        <label
          className='block text-zinc-400 font-bold mb-1 pr-4'
          htmlFor='inline-full-name'>
          Repository URL
        </label>
        <input
          className='block p-2 pl-4 w-full text-zinc-900 bg-zinc-50 rounded-lg border border-zinc-200 sm:text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          id='inline-full-name'
          name={'url'}
          type={'url'}
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={`https://github.com/${authUser.displayName}/MyRepo`}
          required={true}
          autoFocus={true}
          pattern={regExp.source}
        />
      </fieldset>
      <StepperButtons
        disabledNext={url.length < 10 || regExp.test(url) === false}
        onNext={() => {
          const onContinue = async () => {
            const results = regExp.exec(url)
            if (!results[1]) return

            const { domain, namespace, repo, host } = await IdentifyRepoHost(
              results[1],
              url,
              auth
            )

            let tags = await host.getTags({
              domain,
              namespace,
              repo,
              auth,
            })
            tags = tags.filter(({ name }) =>
              semantic.valid(name, { includePrerelease: true })
            )
            if (tags.length < 1) {
              finalTag.current = ''
              finalOptions.current = []
              return
            }
            finalTag.current = tags[0].commit.sha
            finalOptions.current = tags.map(({ name, commit: { sha } }) => (
              <option
                key={sha}
                value={sha}
                className={
                  'bg-zinc-100 appearance-none border-2 border-zinc-200 rounded w-full py-2 px-4 text-zinc-700 leading-tight focus:outline-none focus:bg-white focus:border-slate-500'
                }>
                {name}
              </option>
            ))
          }
          onContinue().then(() => {
            finalUrl.current = url
            handleNext()
          })
        }}
        onBack={handleBack}
      />
    </>
  )
}

const ChooseATag = ({
  url,
  finalTag,
  finalOptions,
  finalPath,
  finalManifestContents,
  finalEnableDescription,
  finalDescriptionContents,
  finalEnableChangelog,
  finalChangelogContents,
  auth,
  handleNext,
  handleBack,
}) => {
  const [tag, setTag] = useState(finalTag.current)
  const [needsPath, setNeedsPath] = useState(finalPath.current !== '')
  const [path, setPath] = useState(finalPath.current)

  return (
    <>
      <fieldset className={'max-w-lg flex flex-col'}>
        <label
          className='block text-zinc-400 font-bold mb-1 pr-4'
          htmlFor='inline-password'>
          Tag / Release
        </label>
        <select
          className='block p-2 pl-4 text-zinc-900 bg-zinc-50 rounded-lg border border-zinc-200 sm:text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          id='inline-password'
          defaultValue={tag}
          onChange={e => setTag(e.target.value)}
          required={true}
          autoFocus={true}>
          {finalOptions.current}
        </select>
        <div className={needsPath ? 'mb-6' : 'hidden'}>
          <label
            className='block text-zinc-400 font-bold mb-1 pr-4'
            htmlFor='inline-full-name'>
            Path / To / Plugin
          </label>
          <input
            className='block p-2 pl-4 w-full text-zinc-900 bg-zinc-50 rounded-lg border border-zinc-200 sm:text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
            id='inline-full-name'
            type={'text'}
            placeholder={'Path/To/Plugin'}
            value={path}
            onChange={e => setPath(e.target.value)}
            required={false}
          />
        </div>
      </fieldset>
      <StepperButtons
        disabledNext={
          tag === '' || (needsPath && finalManifestContents.current === '')
        }
        onNext={() => {
          const onContinue = async () => {
            const results = regExp.exec(url)
            if (!results[1]) return

            const { domain, namespace, repo, host } = await IdentifyRepoHost(
              results[1],
              url,
              auth
            )

            finalManifestContents.current =
              (await host.getRepoFileContent({
                domain,
                namespace,
                repo,
                commit: tag,
                path,
                file: 'plugin.yml',
                auth,
              })) ?? ''
            if (path === '' && finalManifestContents.current === '')
              setNeedsPath(true)
            else setNeedsPath(false)
            finalDescriptionContents.current =
              (await host.getRepoFileUrl({
                domain,
                namespace,
                repo,
                commit: tag,
                path,
                file: 'README.md',
                auth,
              })) ??
              (await host.getRepoFileUrl({
                domain,
                namespace,
                repo,
                commit: tag,
                path,
                file: 'readme.md',
                auth,
              })) ??
              ''
            finalEnableDescription.current =
              finalDescriptionContents.current !== ''
            finalChangelogContents.current =
              (await host.getRepoFileUrl({
                domain,
                namespace,
                repo,
                commit: tag,
                path,
                file: 'CHANGELOG.md',
                auth,
              })) ??
              (await host.getRepoFileUrl({
                domain,
                namespace,
                repo,
                commit: tag,
                path,
                file: 'changelog.md',
                auth,
              })) ??
              ''
            finalEnableChangelog.current = finalChangelogContents.current !== ''

            finalPath.current = path
            finalTag.current = tag
          }
          onContinue().then(handleNext)
        }}
        onBack={handleBack}
      />
    </>
  )
}

const FinalStep = ({
  manifestContents,
  finalEnableDescription,
  descriptionContents,
  finalEnableChangelog,
  changelogContents,
  handleBack,
  setPage,
}) => {
  const [enableDescription, setEnableDescription] = useState(
    finalEnableDescription.current
  )
  const [enableChangelog, setEnableChangelog] = useState(
    finalEnableChangelog.current
  )
  return (
    <>
      <fieldset className='w-full max-w-lg flex flex-col'>
        <legend className='sr-only'>Optional Imports</legend>
        <div className='flex items-center mb-4'>
          <input
            id='checkbox-1'
            aria-describedby='checkbox-1'
            type='checkbox'
            name={'enableManifest'}
            defaultChecked={true}
            required={true}
            disabled={true}
            className='w-4 h-4 text-blue-600 bg-white dark:bg-zinc-900 rounded border-zinc-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600'
          />
          <label
            htmlFor='checkbox-1'
            className='ml-3 text-sm font-medium text-zinc-900 dark:text-zinc-300'>
            Import plugin.yml
          </label>
        </div>

        <div className='flex items-center mb-4'>
          <input
            id='checkbox-2'
            aria-describedby='checkbox-2'
            type='checkbox'
            name={'enableDescription'}
            checked={enableDescription}
            readOnly
            onClick={() => setEnableDescription(!enableDescription)}
            className='w-4 h-4 text-blue-600 bg-white dark:bg-zinc-900 rounded border-zinc-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600'
          />
          <label
            htmlFor='checkbox-2'
            className='ml-3 text-sm font-medium text-zinc-900 dark:text-zinc-300'>
            Import README.md
          </label>
        </div>

        <div className='flex items-center mb-4'>
          <input
            id='checkbox-3'
            aria-describedby='checkbox-3'
            type='checkbox'
            name={'enableChangelog'}
            checked={enableChangelog}
            readOnly
            onClick={() => setEnableChangelog(!enableChangelog)}
            className='w-4 h-4 text-blue-600 bg-white dark:bg-zinc-900 rounded border-zinc-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600'
          />
          <label
            htmlFor='checkbox-3'
            className='ml-3 text-sm font-medium text-zinc-900 dark:text-zinc-300'>
            Import CHANGELOG.md
          </label>
        </div>
      </fieldset>
      <StepperButtons
        disabledNext={
          manifestContents === '' ||
          (enableDescription && descriptionContents === '') ||
          (enableChangelog && changelogContents === '')
        }
        onNext={() => {
          finalEnableDescription.current = enableDescription
          finalEnableChangelog.current = enableChangelog
          setPage(1)
        }}
        onBack={handleBack}
        nextText={
          <>
            <Web className={'hidden dark:inline-block'} />
            <WebOutlined className={'dark:hidden'} />
            <span className={'ml-2'}>Preview</span>
          </>
        }
      />
    </>
  )
}

const StepperButtons = ({
  disabledNext,
  disabledBack = false,
  onNext = null,
  onBack = null,
  nextText = 'Continue',
}) => (
  <div className={'mb-1'}>
    <Button
      className={'bg-blue-700 dark:bg-zinc-700'}
      variant='contained'
      disabled={disabledNext}
      onClick={onNext}
      sx={{ mt: 1, mr: 1 }}>
      {nextText}
    </Button>
    <Button disabled={disabledBack} onClick={onBack} sx={{ mt: 1, mr: 1 }}>
      Back
    </Button>
  </div>
)
