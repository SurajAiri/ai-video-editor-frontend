import { BrowserRouter, Route, Routes } from "react-router-dom"
import UploadScreen from "./screens/UploadScreen"
import VideoAnalysisLoading from "./screens/AnalysisScreen"
import TestScreen from "./screens/TestScreen"
import VideoEditor from "./screens/VideoEditor"



function App() {
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadScreen />} />
        <Route path="/analysis/:job_id" element={<VideoAnalysisLoading />} />
        <Route path="/editor/:job_id" element={<VideoEditor />} /> 
        <Route path="/test" element={<TestScreen />} />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
