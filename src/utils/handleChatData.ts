export function handleChatData(text: string) {
  const lines = text.split('\x01\x01')
  const data = []
  const parseErrors = []

  const isValidData = (data: any) => {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.answer === 'string' &&
      data.answer.trim() !== ''
    )
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line !== '') {
      try {
        console.log('line', line)
        const cache = line.split('\0\0');
        const parsedData = {
          success: cache[0],
          code: cache[1],
          message: cache[2],
          answer: cache[3],
          segment: cache[4],
          timestamp: cache[5],
        };
        console.log('line2', parsedData)
        if (isValidData(parsedData)) {
          data.push({ ...parsedData })
        } else {
          parseErrors.push(line)
        }
      } catch (error) {
        parseErrors.push(line)
      }
    }
  }

  return data
}
