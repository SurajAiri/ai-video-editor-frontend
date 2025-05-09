import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Keyboard, Save, Trash2, Edit2 } from "lucide-react";
import useTranscriptStore from "@/stores/TranscriptStore";
import { useInvalidStore } from "@/stores/InvalidStore";
import { TranscriptWordModel } from "@/types/TranscriptWordModel";
import { InvalidModel } from "@/types/InvalidModel";
import { saveInvalidSegments } from "@/apis/api";

interface WordGroup {
  words: TranscriptWordModel[];
  startIndex: number;
  endIndex: number;
  start_time: number;
  end_time: number;
}

interface SelectedRange {
  startIndex: number;
  endIndex: number;
  start_time: number;
  end_time: number;
}

const TranscriptEditor: React.FC = () => {
  // Get data from stores
  const { transcript } = useTranscriptStore();
  const {
    editing: invalidSegments,
    setEditing,
    removeInvalidSegment,
    jobId,
  } = useInvalidStore();

  // Local state
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null
  );
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [selectedInvalidIndex, setSelectedInvalidIndex] = useState<
    number | null
  >(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check fullscreen status using ResizeObserver and MutationObserver
  useEffect(() => {
    const checkFullscreen = () => {
      const container = containerRef.current;
      if (container) {
        const isInFullscreenTab = container
          .closest('[data-state="active"]')
          ?.classList.contains("flex-grow");
        setIsFullscreen(!!isInFullscreenTab);
      }
    };

    // Initial check with a slight delay to ensure DOM is ready
    setTimeout(checkFullscreen, 100);

    // Setup a resize observer to detect size changes
    const resizeObserver = new ResizeObserver(checkFullscreen);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Setup a mutation observer to detect DOM changes (when switching tabs)
    const mutationObserver = new MutationObserver(checkFullscreen);
    if (containerRef.current?.parentElement) {
      mutationObserver.observe(containerRef.current.parentElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class", "data-state"],
      });
    }

    // Check fullscreen status when tab becomes active
    const tabStateChangeListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.getAttribute("data-state") === "active") {
        setTimeout(checkFullscreen, 50);
      }
    };

    document.addEventListener("transitionend", tabStateChangeListener);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("transitionend", tabStateChangeListener);
    };
  }, []);

  // Group words with continuous timestamps
  useEffect(() => {
    if (!transcript.length) return;

    const groups: WordGroup[] = [];
    let currentGroup: WordGroup | null = null;

    transcript.forEach((wordObj, index) => {
      if (!currentGroup) {
        // Start a new group
        currentGroup = {
          words: [wordObj],
          startIndex: index,
          endIndex: index,
          start_time: wordObj.start,
          end_time: wordObj.end,
        };
      } else {
        // Check if this word is continuous with the current group
        // We're considering words continuous if the gap is less than 0.2 seconds
        const timeDiff = wordObj.start - currentGroup.end_time;

        if (timeDiff <= 0.2) {
          // Add to current group
          currentGroup.words.push(wordObj);
          currentGroup.endIndex = index;
          currentGroup.end_time = wordObj.end;
        } else {
          // Save the current group and start a new one
          groups.push(currentGroup);
          currentGroup = {
            words: [wordObj],
            startIndex: index,
            endIndex: index,
            start_time: wordObj.start,
            end_time: wordObj.end,
          };
        }
      }
    });

    // Add the last group if it exists
    if (currentGroup) {
      groups.push(currentGroup);
    }

    setWordGroups(groups);
  }, [transcript]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts if we have a selection
      if (!selectedRange) return;

      // Prevent default for our shortcut keys
      if (["r", "f", "p", "Escape", "d"].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "r":
        case "z":
          addInvalidSegment("repetition");
          break;
        case "f":
        case "x":
          addInvalidSegment("filler_words");
          break;
        case "p":
        case "c":
          addInvalidSegment("long_pause");
          break;
        case "d":
        case "b":
          // Delete the selected invalid segment
          if (selectedInvalidIndex !== null) {
            handleRemoveInvalidSegment();
          }
          break;
        case "Escape":
        case "v":
          setSelectedRange(null);
          setSelectedInvalidIndex(null);
          break;
        case "?":
          setShowShortcutHelp((prev) => !prev);
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRange, selectedInvalidIndex]);

  // Check if word is part of an invalid segment
  const isWordInInvalidSegment = (wordIndex: number) => {
    return invalidSegments.some((segment) => {
      const segmentStartTime = segment.start_time;
      const segmentEndTime = segment.end_time;
      const wordStartTime = transcript[wordIndex].start;
      const wordEndTime = transcript[wordIndex].end;

      // More precise check to prevent extra words from being highlighted
      return (
        // Word starts within segment
        (wordStartTime >= segmentStartTime && wordStartTime < segmentEndTime) ||
        // Word ends within segment
        (wordEndTime > segmentStartTime && wordEndTime <= segmentEndTime) ||
        // Word completely contains segment
        (wordStartTime <= segmentStartTime && wordEndTime >= segmentEndTime)
      );
    });
  };

  // Get the invalid segment type and index for a word
  const getInvalidSegmentInfoForWord = (wordIndex: number) => {
    for (let i = 0; i < invalidSegments.length; i++) {
      const segment = invalidSegments[i];
      const segmentStartTime = segment.start_time;
      const segmentEndTime = segment.end_time;
      const wordStartTime = transcript[wordIndex].start;
      const wordEndTime = transcript[wordIndex].end;

      // Use the same exact logic as isWordInInvalidSegment for consistency
      if (
        (wordStartTime >= segmentStartTime && wordStartTime < segmentEndTime) ||
        (wordEndTime > segmentStartTime && wordEndTime <= segmentEndTime) ||
        (wordStartTime <= segmentStartTime && wordEndTime >= segmentEndTime)
      ) {
        return { type: segment.type, index: i };
      }
    }
    return { type: null, index: null };
  };

  // Find all word indices in an invalid segment
  const findWordIndicesInInvalidSegment = (segmentIndex: number) => {
    const segment = invalidSegments[segmentIndex];
    if (!segment) return { startIndex: -1, endIndex: -1 };

    const segmentStartTime = segment.start_time;
    const segmentEndTime = segment.end_time;

    let startIndex = -1;
    let endIndex = -1;

    // Find the first and last word in the segment
    for (let i = 0; i < transcript.length; i++) {
      const wordStartTime = transcript[i].start;
      const wordEndTime = transcript[i].end;

      // Check if word is in segment
      const isInSegment =
        (wordStartTime >= segmentStartTime && wordStartTime < segmentEndTime) ||
        (wordEndTime > segmentStartTime && wordEndTime <= segmentEndTime) ||
        (wordStartTime <= segmentStartTime && wordEndTime >= segmentEndTime);

      if (isInSegment) {
        if (startIndex === -1) startIndex = i;
        endIndex = i;
      } else if (endIndex !== -1) {
        // We've found the end of the segment
        break;
      }
    }

    return { startIndex, endIndex };
  };

  const handleSaveInvalids = async ()=>{
    // Here you would typically save changes to your backend
    console.log("Saving invalid segments", invalidSegments);
    const res = await saveInvalidSegments(jobId || "", invalidSegments);
    console.log("Save response:", res);
  }

  // Word selection in transcript (individual word level)
  const handleWordClick = (globalIndex: number) => {
    // Check if the word is part of an invalid segment
    const { index: invalidIndex } = getInvalidSegmentInfoForWord(globalIndex);

    if (invalidIndex !== null) {
      // Word is part of an invalid segment, select entire segment
      const { startIndex, endIndex } =
        findWordIndicesInInvalidSegment(invalidIndex);

      if (startIndex !== -1 && endIndex !== -1) {
        setSelectedRange({
          startIndex,
          endIndex,
          start_time: transcript[startIndex].start,
          end_time: transcript[endIndex].end,
        });
        setSelectedInvalidIndex(invalidIndex);
      }
    } else {
      // Normal word selection
      setSelectedInvalidIndex(null);

      if (!selectedRange) {
        // Start new selection
        setSelectedRange({
          startIndex: globalIndex,
          endIndex: globalIndex,
          start_time: transcript[globalIndex].start,
          end_time: transcript[globalIndex].end,
        });
      } else if (
        selectedRange.startIndex === globalIndex &&
        selectedRange.endIndex === globalIndex
      ) {
        // Deselect if clicking on a single word selection
        setSelectedRange(null);
      } else {
        // Expand or adjust selection
        const newStartIndex = Math.min(selectedRange.startIndex, globalIndex);
        const newEndIndex = Math.max(selectedRange.startIndex, globalIndex);

        setSelectedRange({
          startIndex: newStartIndex,
          endIndex: newEndIndex,
          start_time: transcript[newStartIndex].start,
          end_time: transcript[newEndIndex].end,
        });
      }
    }
  };

  // Add new invalid segment from transcript selection
  const addInvalidSegment = (
    type: "filler_words" | "repetition" | "long_pause"
  ) => {
    if (selectedRange) {
      const selectedText = transcript
        .slice(selectedRange.startIndex, selectedRange.endIndex + 1)
        .map((item) => item.word)
        .join(" ");

      const newSegment: InvalidModel = {
        start_time: selectedRange.start_time,
        end_time: selectedRange.end_time,
        type,
        is_entire: false,
        text: selectedText,
        startIndex: selectedRange.startIndex,
        endIndex: selectedRange.endIndex,
      };

      if (selectedInvalidIndex !== null) {
        // Update existing invalid segment
        const updatedSegments = [...invalidSegments];
        updatedSegments[selectedInvalidIndex] = newSegment;
        setEditing(updatedSegments);
      } else {
        // Add new invalid segment
        setEditing([...invalidSegments, newSegment]);
      }

      setSelectedRange(null);
      setSelectedInvalidIndex(null);
    }
  };

  // Handle removing an invalid segment
  const handleRemoveInvalidSegment = () => {
    if (selectedInvalidIndex !== null) {
      removeInvalidSegment(selectedInvalidIndex);
      setSelectedRange(null);
      setSelectedInvalidIndex(null);
    }
  };

  // Toggle keyboard shortcuts help
  const toggleShortcutHelp = () => {
    setShowShortcutHelp(!showShortcutHelp);
  };

  return (
    <div
      className={`w-full max-w-6xl mx-auto ${isFullscreen ? "h-full flex flex-col" : ""}`}
      ref={containerRef}
    >
      <Card className="border border-blue-100 shadow-md bg-white overflow-hidden flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex-shrink-0">
          <CardTitle className="text-lg font-semibold text-blue-800 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"></path>
            </svg>
            Transcript Editor
          </CardTitle>

          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              <span className="mr-1 font-medium">Shortcuts:</span>
              <Badge
                variant="outline"
                className="mr-1 bg-white border-blue-200"
              >
                R
              </Badge>
              <Badge
                variant="outline"
                className="mr-1 bg-white border-blue-200"
              >
                F
              </Badge>
              <Badge
                variant="outline"
                className="mr-1 bg-white border-blue-200"
              >
                P
              </Badge>
              <Badge
                variant="outline"
                className="mr-1 bg-white border-blue-200"
              >
                D
              </Badge>
              <Badge variant="outline" className="bg-white border-blue-200">
                Esc
              </Badge>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleShortcutHelp}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Keyboard className="h-4 w-4 mr-1" />
                    Shortcuts
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-blue-800 text-white">
                  Press ? to show/hide shortcut help
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-grow overflow-auto pb-1">
          <ScrollArea
            className={`${
              isFullscreen ? "h-[60vh]" : "h-90"
            } mb-2 border border-blue-100 rounded-lg`}
          >
            <div className="space-y-2 p-3">
              {wordGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="flex flex-wrap gap-x-1 mb-3 border-b border-blue-100 pb-2"
                >
                  {/* Group timestamp indicator */}
                  <div className="w-full text-xs text-blue-500 mb-1 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {group.start_time.toFixed(1)}s - {group.end_time.toFixed(1)}
                    s
                  </div>

                  {/* Words within the group */}
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      // Pre-process to determine continuous selection spans
                      const selectionRanges: { start: number; end: number; type: string | null; segmentId: number | null }[] = [];
                      let currentRange: { start: number; end: number; type: string | null; segmentId: number | null } | null = null;

                      group.words.forEach((wordObj, wordIndex) => {
                        const globalIndex = group.startIndex + wordIndex;
                        const isSelected = selectedRange && 
                          globalIndex >= selectedRange.startIndex && 
                          globalIndex <= selectedRange.endIndex;
                        
                        // Get invalid segment info including segment index
                        const { type: invalidType, index: invalidIndex } = getInvalidSegmentInfoForWord(globalIndex);
                        
                        // Determine the current status of this word
                        const currentStatus = isSelected ? 'selected' : invalidType;
                        const currentSegmentId = invalidType ? invalidIndex : null;
                        
                        if (!currentRange) {
                          // Start a new range
                          currentRange = { 
                            start: wordIndex, 
                            end: wordIndex, 
                            type: currentStatus, 
                            segmentId: currentSegmentId 
                          };
                        } else if (
                          currentRange.type === currentStatus && 
                          // For invalid segments, we need to check if it's the same segment
                          (currentStatus === 'selected' || currentRange.segmentId === currentSegmentId)
                        ) {
                          // Extend the current range only if it's the same segment
                          currentRange.end = wordIndex;
                        } else {
                          // End the current range and start a new one
                          selectionRanges.push({ ...currentRange });
                          currentRange = { 
                            start: wordIndex, 
                            end: wordIndex, 
                            type: currentStatus, 
                            segmentId: currentSegmentId 
                          };
                        }
                      });

                      // Add the last range if it exists
                      if (currentRange) {
                        selectionRanges.push(currentRange);
                      }

                      // Render each continuous range as a single container
                      return selectionRanges.map((range, rangeIndex) => {
                        const rangeWords = group.words.slice(range.start, range.end + 1);
                        
                        // Styling based on selection and invalid status
                        let containerBgClass = "bg-white";
                        let containerBorderClass = "rounded-md";
                        
                        if (range.type === 'selected') {
                          containerBgClass = "bg-blue-500";
                          containerBorderClass = "shadow-sm rounded-md";
                        } else if (range.type) {
                          // Different invalid types get different styling
                          switch (range.type) {
                            case "repetition":
                              containerBgClass = "bg-red-50";
                              containerBorderClass = "border border-red-200 rounded-md";
                              break;
                            case "filler_words":
                              containerBgClass = "bg-yellow-50";
                              containerBorderClass = "border border-yellow-200 rounded-md";
                              break;
                            case "long_pause":
                              containerBgClass = "bg-blue-50";
                              containerBorderClass = "border border-blue-200 rounded-md";
                              break;
                            default:
                              containerBgClass = "bg-gray-50";
                              containerBorderClass = "border border-gray-200 rounded-md";
                          }
                        }
                        
                        return (
                          <span
                            key={rangeIndex}
                            className={`inline-flex flex-wrap items-center px-2 py-1 transition-colors ${containerBgClass} ${containerBorderClass}`}
                          >
                            {/* Render individual words inside the container to maintain word-level selection */}
                            {rangeWords.map((wordObj, innerWordIndex) => {
                              const globalIndex = group.startIndex + range.start + innerWordIndex;
                              const wordClass = range.type === 'selected' ? 'text-white hover:underline' : 
                                              (range.type === 'repetition' ? 'text-red-800' : 
                                               range.type === 'filler_words' ? 'text-yellow-800' : 
                                               range.type === 'long_pause' ? 'text-blue-800' : 'text-gray-800');
                              
                              return (
                                <span
                                  key={innerWordIndex}
                                  className={`cursor-pointer ${wordClass} hover:opacity-80`}
                                  onClick={() => handleWordClick(globalIndex)}
                                  style={{ marginRight: innerWordIndex < rangeWords.length - 1 ? '0.25rem' : 0 }}
                                >
                                  {wordObj.word}
                                </span>
                              );
                            })}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedRange && (
            <div
              className={`border border-blue-100 rounded-lg p-3 mb-0 bg-blue-50 ${
                isFullscreen ? "sticky bottom-4 z-10" : ""
              }`}
            >
              <div className="font-medium text-blue-800 mb-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
                {selectedInvalidIndex !== null
                  ? "Edit Invalid Segment:"
                  : "Selected Range:"}
              </div>
              <div className="text-sm mb-2 text-blue-700">
                <span className="font-medium">Time:</span>{" "}
                {selectedRange.start_time.toFixed(2)}s -{" "}
                {selectedRange.end_time.toFixed(2)}s
              </div>
              <div className="text-sm mb-3 text-blue-700">
                <span className="font-medium">Text:</span>{" "}
                {transcript
                  .slice(selectedRange.startIndex, selectedRange.endIndex + 1)
                  .map((item) => item.word)
                  .join(" ")}
              </div>

              {selectedInvalidIndex !== null ? (
                <div className="flex gap-2 flex-wrap">
                  <div className="w-full mb-2 text-sm text-blue-700">
                    <span className="font-medium">Current Type:</span>{" "}
                    {invalidSegments[selectedInvalidIndex].type.replace(
                      "_",
                      " "
                    )}
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addInvalidSegment("repetition")}
                          className="bg-red-500 hover:bg-red-600 text-white shadow-sm"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Change to Repetition
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-red-800 text-white"
                      >
                        Shortcut: R
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addInvalidSegment("filler_words")}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Change to Filler Words
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-yellow-800 text-white"
                      >
                        Shortcut: F
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addInvalidSegment("long_pause")}
                          className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Change to Long Pause
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-blue-800 text-white"
                      >
                        Shortcut: P
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={handleRemoveInvalidSegment}
                          className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Invalid Segment
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-red-800 text-white"
                      >
                        Shortcut: D
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRange(null);
                            setSelectedInvalidIndex(null);
                          }}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Cancel
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-blue-800 text-white"
                      >
                        Shortcut: Esc
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addInvalidSegment("repetition")}
                          className="bg-red-500 hover:bg-red-600 text-white shadow-sm"
                        >
                          Mark as Repetition
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-red-800 text-white"
                      >
                        Shortcut: R
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addInvalidSegment("filler_words")}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm"
                        >
                          Mark as Filler Words
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-yellow-800 text-white"
                      >
                        Shortcut: F
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => addInvalidSegment("long_pause")}
                          className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                        >
                          Mark as Long Pause
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-blue-800 text-white"
                      >
                        Shortcut: P
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRange(null)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Clear Selection
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-blue-800 text-white"
                      >
                        Shortcut: Esc
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Keyboard shortcut help modal */}
        {showShortcutHelp && (
          <div
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
            onClick={toggleShortcutHelp}
          >
            <Card
              className="w-96 border-blue-200 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-blue-800 flex items-center">
                  <Keyboard className="h-5 w-5 mr-2" />
                  Keyboard Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                    <div>
                      <Badge className="bg-blue-100 text-blue-800 font-mono mr-1">
                        r
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 font-mono">
                        z
                      </Badge>
                    </div>
                    <span className="text-gray-300">Mark as Repetition</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                    <div>
                      <Badge className="bg-blue-100 text-blue-800 font-mono mr-1">
                        f
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 font-mono">
                        x
                      </Badge>
                    </div>
                    <span className="text-gray-300">Mark as Filler Words</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                    <div>
                      <Badge className="bg-blue-100 text-blue-800 font-mono mr-1">
                        p
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 font-mono">
                        c
                      </Badge>
                    </div>
                    <span className="text-gray-300">Mark as Long Pause</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                    <div>
                      <Badge className="bg-blue-100 text-blue-800 font-mono mr-1">
                        Esc
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 font-mono">
                        v
                      </Badge>
                    </div>
                    <span className="text-gray-300">Clear Selection</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                    <div>
                      <Badge className="bg-blue-100 text-blue-800 font-mono mr-1">
                        d
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 font-mono">
                        b
                      </Badge>
                    </div>
                    <span className="text-gray-300">
                      Delete Invalid Segment
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge className="bg-blue-100 text-blue-800 font-mono">
                      ?
                    </Badge>
                    <span className="text-gray-300">Show/Hide Shortcuts</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-3 border-t border-blue-100">
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={toggleShortcutHelp}
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <CardFooter className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100 pt-2 pb-3 px-4 flex-shrink-0">
          <Button
            onClick={handleSaveInvalids}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TranscriptEditor;
