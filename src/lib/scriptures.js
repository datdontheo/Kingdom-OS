export const SCRIPTURES = [
  { ref: 'Matthew 6:33', text: 'But seek first the kingdom of God and His righteousness, and all these things shall be added to you.' },
  { ref: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the Lord your God is with you wherever you go.' },
  { ref: 'Proverbs 16:3', text: 'Commit your works to the Lord, and your thoughts will be established.' },
  { ref: 'Isaiah 40:31', text: 'But those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
  { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, says the Lord, thoughts of peace and not of evil, to give you a future and a hope.' },
  { ref: '2 Timothy 2:2', text: 'And the things that you have heard from me among many witnesses, commit these to faithful men who will be able to teach others also.' },
  { ref: 'Acts 1:8', text: 'But you shall receive power when the Holy Spirit has come upon you; and you shall be witnesses to Me in Jerusalem, and in all Judea and Samaria, and to the end of the earth.' },
  { ref: 'Habakkuk 2:2', text: 'Write the vision and make it plain on tablets, that he may run who reads it.' },
  { ref: 'Nehemiah 4:6', text: 'So we built the wall, and the entire wall was joined together up to half its height, for the people had a mind to work.' },
  { ref: 'Romans 8:28', text: 'And we know that all things work together for good to those who love God, to those who are the called according to His purpose.' },
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth!' },
  { ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths.' },
  { ref: 'John 15:5', text: 'I am the vine, you are the branches. He who abides in Me, and I in him, bears much fruit; for without Me you can do nothing.' },
  { ref: '1 Corinthians 3:9', text: 'For we are God\'s fellow workers; you are God\'s field, you are God\'s building.' },
  { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?' },
  { ref: 'Isaiah 54:2', text: 'Enlarge the place of your tent, and let them stretch out the curtains of your dwellings; do not spare; lengthen your cords, and strengthen your stakes.' },
  { ref: 'Matthew 28:19-20', text: 'Go therefore and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all things that I have commanded you.' },
  { ref: 'Ephesians 3:20', text: 'Now to Him who is able to do exceedingly abundantly above all that we ask or think, according to the power that works in us.' },
  { ref: 'Psalm 1:2-3', text: 'But his delight is in the law of the Lord, and in His law he meditates day and night. He shall be like a tree planted by the rivers of water, that brings forth its fruit in its season.' },
  { ref: 'Colossians 3:23', text: 'And whatever you do, do it heartily, as to the Lord and not to men.' },
  { ref: 'Isaiah 60:1', text: 'Arise, shine; for your light has come! And the glory of the Lord is risen upon you.' },
  { ref: 'Psalm 92:12-13', text: 'The righteous shall flourish like a palm tree, he shall grow like a cedar in Lebanon. Those who are planted in the house of the Lord shall flourish in the courts of our God.' },
  { ref: 'Romans 12:2', text: 'And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God.' },
  { ref: '2 Chronicles 7:14', text: 'If My people who are called by My name will humble themselves, and pray and seek My face, and turn from their wicked ways, then I will hear from heaven, and will forgive their sin and heal their land.' },
  { ref: 'Zechariah 4:6', text: 'Not by might nor by power, but by My Spirit, says the Lord of hosts.' },
  { ref: 'Mark 10:45', text: 'For even the Son of Man did not come to be served, but to serve, and to give His life a ransom for many.' },
  { ref: 'Psalm 34:18', text: 'The Lord is near to those who have a broken heart, and saves such as have a contrite spirit.' },
  { ref: 'Galatians 6:9', text: 'And let us not grow weary while doing good, for in due season we shall reap if we do not lose heart.' },
  { ref: 'Lamentations 3:22-23', text: 'Through the Lord\'s mercies we are not consumed, because His compassions fail not. They are new every morning; great is Your faithfulness.' },
]

export function getDailyScripture() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return SCRIPTURES[dayOfYear % SCRIPTURES.length]
}
