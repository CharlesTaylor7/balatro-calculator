import { JokerList } from "@/JokerList";
import { Rounds } from "@/Rounds";
import { ModeToggle } from "./components/mode-toggle";
import { BossBlindSelector } from "./components/boss-blind-selector";
import { HandCountTable } from "./components/hand-planet-table";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      {/* Top navigation bar with settings and theme toggle */}
      <div className="flex justify-between w-full mb-4">
        <div>
          <BossBlindSelector />
        </div>
        <div>
          <ModeToggle />
        </div>
      </div>

      {/* Main content area with drawers */}
      <div className="flex flex-1">
        {/* Left drawer for Jokers */}
        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button variant="outline" className="mb-2">Jokers</Button>
          </DrawerTrigger>
          <DrawerContent className="w-[350px] sm:w-[400px] max-w-[95vw]">
            <DrawerHeader>
              <DrawerTitle>Jokers</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 py-2 overflow-y-auto">
              <JokerList />
            </div>
          </DrawerContent>
        </Drawer>

        {/* Center area for Rounds */}
        <div className="flex-1 mx-4">
          <Rounds />
        </div>

        {/* Right drawer for Hand Table */}
        <Drawer direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" className="mb-2">Hand Table</Button>
          </DrawerTrigger>
          <DrawerContent className="w-[350px] sm:w-[450px]">
            <DrawerHeader>
              <DrawerTitle>Hand Table</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <HandCountTable />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
