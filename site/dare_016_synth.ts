export function computeAdsrEnvelope(
	time: number,
	a = 0.1,
	d = 0.2,
	s = 0.7,
	r = 0.3,
) {
	if (time < a) return time / a;
	if (time < a + d) return 1.0 - ((time - a) / d) * (1.0 - s);
	return s;
}
