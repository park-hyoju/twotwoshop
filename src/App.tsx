import { Footer, Header } from './components/layout'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-center text-lg text-neutral-500">
          쇼핑몰 메인 콘텐츠 영역
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default App
