import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Spreadsheet from "./components/spreadsheet";
import './App.css';

export default function App() {
  return (
    <div>
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main>
        <SignedIn>
          <Spreadsheet />
        </SignedIn>
      </main>
    </div>
  );
}
