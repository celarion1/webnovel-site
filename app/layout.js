import "./globals.css";
import Sidebar from "../components/Sidebar";
import PageTracker from "../components/PageTracker";

export const metadata = {
  title: "내 웹소설 서재",
  description: "직접 쓴 웹소설을 모아둔 공간입니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <PageTracker />
        <header className="site-header">
          <div className="sky">
            <span className="cloud cloud-1" />
            <span className="cloud cloud-2" />
            <span className="cloud cloud-3" />
            <span className="cloud cloud-4" />
          </div>
          <div className="site-header-inner">
            <a href="/">☁️ 내 웹소설 서재</a>
          </div>
        </header>

        <div className="app-shell">
          <Sidebar />
          <div className="reading-area">{children}</div>
        </div>
      </body>
    </html>
  );
}
