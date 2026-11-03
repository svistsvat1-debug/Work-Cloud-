"""Make Kokoro ONNX report per-phoneme durations (exact word times without Whisper).
Downloads (free, GitHub releases of kokoro-onnx):
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
usage: python3 patch_kokoro.py <kokoro_dir>   -> writes kokoro-v1.0-timed.onnx next to the original.
The duration predictor's integer frame counts ('/encoder/Gather_output_0') become an extra graph output
named 'duration'; kokoro-onnx's create_timed() then returns phoneme timings."""
import sys
import onnx
from onnx import helper, TensorProto

d = sys.argv[1]
m = onnx.load(f"{d}/kokoro-v1.0.onnx")
m.graph.node.append(helper.make_node('Identity', ['/encoder/Gather_output_0'], ['duration'], name='dur_out'))
m.graph.output.append(helper.make_tensor_value_info('duration', TensorProto.INT64, None))
onnx.save(m, f"{d}/kokoro-v1.0-timed.onnx")
print('saved', f"{d}/kokoro-v1.0-timed.onnx")
