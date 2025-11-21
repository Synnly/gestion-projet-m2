export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
  postedAt: string;
  type: string;
  category: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
}
export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Software Engineer Intern',
    company: 'Google',
    location: 'Mountain View, CA',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTWmOAx7qzcaa3DAdSUdcWvSi0dkhrr9ora2dIqsBqWBsrsiu-NJ9AHMR_ZGklpOPUl8ZYWLDilhsVxbs6RGF99ujRRVJev0w54lFSvlQ5S4nyewpS6ge2h0KxlS_fpeREAIcj7UwZ4cs8nhvVyJZXqINtoFTWF59uuYKtEJ_iW2TYDZPwU4cOA4W8wYS-3oYdT326ETTcTjkGFfhjyFzgT52BHpkouleC-3-c0hMAJfc11wvDjZmrl2oxqeGkwTXtFQB6l1SAMlin',
    postedAt: '3d ago',
    type: 'Internship',
    category: 'Engineering',
    description: 'Join Google as a Software Engineer Intern and work on cutting-edge technologies.',
    responsibilities: ['Write clean code', 'Collaborate with team', 'Learn from mentors'],
    qualifications: ['CS student', 'Programming skills', 'Problem solving']
  },
  {
    id: '2',
    title: 'Product Manager, Cloud',
    company: 'Microsoft',
    location: 'Remote',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIlckN0U5WetR-TZn0A-wk_yrctrDxwDn3iEUBS8VY2kQHto87PaZ1B5UW6vz_jrHAg8vsjUCTUCa8-ZQsAJ3eYD0ZAt9JpM3seR8MOlhGC_wFc3PlSDHLL_10_OFtsLvhqTawSynabLVhCXJ46ZuX-G1dSDYrNOXX5EaDeXyNDRbztpzR-JX_MOpmtz3IhAQZjAfDh0ZlnGDL1cX3rTG8hKaOpWa_kOAVggczXpmxpEygDt7yuXF_MTSQpPtC2UVP634kYELVCeaM',
    postedAt: '1d ago',
    type: 'Full-time',
    category: 'Product',
    description: 'Define the future of cloud computing by leading a cross-functional team to build and launch innovative services. As a Product Manager for our cloud platform, you will be responsible for the entire product lifecycle, from ideation and strategy to launch and iteration.',
    responsibilities: [
      'Develop and maintain a product roadmap.',
      'Gather and prioritize product and customer requirements.',
      'Define product vision and strategy.',
      'Work with stakeholders to ensure successful product launches.'
    ],
    qualifications: [
      "Bachelor's degree in Computer Science, Engineering, or a related field.",
      '3+ years of experience in product management.',
      'Strong technical background with experience in cloud technologies.',
      'Excellent communication and leadership skills.'
    ]
  },
  {
    id: '3',
    title: 'UX Designer',
    company: 'Spotify',
    location: 'New York, NY',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrtPMvttr1eaeROPcf7DrayK1Czio8U5sXP5OonfWD7xtzqCJ84x8ROOk2O96bjjKeUgOW1kJuw-TaJkvQJdux4R6IbDMp8v0eK5K1jD6w43bNfELqR1e-q2kiLE2W2uTM72c-41pEJtP4_i-LC74cMxPLcses45j7pLMqv4b6_ATnALTHrMAX1Y93vxB00zYjn8yzDs9dAcA9oN2AecXbRH2zetKMr883Rn2n6ugmUQd0QDu4iGx9CT_0Y_c2_yRuL3M_-6w7at_c',
    postedAt: '5d ago',
    type: 'Full-time',
    category: 'Design',
    description: 'Create beautiful user experiences for millions of Spotify users.',
    responsibilities: ['Design interfaces', 'User research', 'Prototyping'],
    qualifications: ['Design portfolio', 'Figma expertise', '2+ years experience']
  },
  {
    id: '4',
    title: 'Data Analyst',
    company: 'Slack',
    location: 'San Francisco, CA',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5S5fIILC-pDnDJImDiBSIyszYKq_FTE1kWbuSNGgrtmNsnU8VR4VXW0Rb3BIUIoCPZyDc1p3t0CypToIm8bCXP8I5x0c47q_AE0z7042JV2N9zyPAu8x8cWxglnQSbxVl4r680VwK9FIZogl3VItLFz6cirvltguyENbWNqCt2Yr8_1RM3YvdkJ5mUuu6ZQCI96Ex1T8tzh_8prCWQ0zpUYETDB-Uit5xbQbUUdZasZs4cMUKDxSO6v_tCfTmv42c7q-rFfR4fpWy',
    postedAt: '2w ago',
    type: 'Full-time',
    category: 'Analytics',
    description: 'Analyze data to drive business decisions at Slack.',
    responsibilities: ['Data analysis', 'SQL queries', 'Report generation'],
    qualifications: ['Statistics background', 'SQL proficiency', 'Python/R']
  },
  {
    id: '5',
    title: 'Marketing Associate',
    company: 'Airbnb',
    location: 'Remote',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZU-HUd4uhjKv2gs3Oa9kfBC4MnvjYtVl1uSHJutd1sMtC5_5E3vLY4UFzfC33IHuixUJfPS8QGPXIDADHFw9fieYUfmlUQWNAGwXGa-MR_aIGk5Yf-K3RlLpyzU1lYVAqjPF7LdFIPGA0uDsA9gF2eIXtB438cwv29wQq9NbeacYw_U97iqHytjAuAyix_iRyYkQHyGnUTg0YOm_kJVDpolFR5hZdlK18zEIiPBPSJxHycfaMDrFsqlrvWUatXkte1ZWyNMaG_ZBz',
    postedAt: '1m ago',
    type: 'Full-time',
    category: 'Marketing',
    description: 'Drive marketing campaigns for Airbnb experiences.',
    responsibilities: ['Campaign management', 'Content creation', 'Analytics'],
    qualifications: ['Marketing degree', 'Digital marketing', 'Creative thinking']
  },
  {
    id: '6',
    title: 'Frontend Engineer',
    company: 'Figma',
    location: 'Remote',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXIGstFVTqLP6lXoOpP44xieZsCreQFJQBcE5lt0X2BeAUOC9XBnzlZXXOSgg33SAa2AfLi773yAvqoqI_nNwxRysR2s4PQJzaSPjHt0nfGYUnOJKkcuSVDDyfnTE2T7zYXxxI4oCPUPiiinleOBNOnbUAL0L8fE0CSuUFZzU3OT09O7D05he5hnjQhgsw1YSb3t4TG5nPJSEIjnx8ZW-hD2flvyLsomhN6cqVEpovrmTegteZeZpawLMdf0frkfE3i9F2mThPOMIx',
    postedAt: '8d ago',
    type: 'Full-time',
    category: 'Engineering',
    description: 'Build the next generation of design tools with Figma.',
    responsibilities: ['React development', 'Performance optimization', 'UI implementation'],
    qualifications: ['React expertise', 'TypeScript', '3+ years experience']
  }
];